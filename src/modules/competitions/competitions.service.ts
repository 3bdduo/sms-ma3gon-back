import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import {
  Competition, CompetitionParticipant, CompetitionResult,
  Student, EduStudentRef, Group, EduGroup, ExamRecord,
} from "../../schemas";
import { CurrentUserPayload } from "../../common/decorators/current-user.decorator";

@Injectable()
export class CompetitionsService {
  constructor(
    @InjectModel(Competition.name) private readonly competitionModel: Model<Competition>,
    @InjectModel(CompetitionParticipant.name) private readonly participantModel: Model<CompetitionParticipant>,
    @InjectModel(CompetitionResult.name) private readonly resultModel: Model<CompetitionResult>,
    @InjectModel(Student.name) private readonly studentModel: Model<Student>,
    @InjectModel(EduStudentRef.name) private readonly eduStudentRefModel: Model<EduStudentRef>,
    @InjectModel(Group.name) private readonly groupModel: Model<Group>,
    @InjectModel(EduGroup.name) private readonly eduGroupModel: Model<EduGroup>,
    @InjectModel(ExamRecord.name) private readonly examModel: Model<ExamRecord>,
  ) {}

  async findAll(type?: "quran" | "edu") {
    const filter: any = {};
    if (type) filter.type = type;
    const competitions = await this.competitionModel.find(filter).sort({ year: -1 }).lean();
    const counts = await this.participantModel.aggregate([{ $group: { _id: "$competition_id", count: { $sum: 1 } } }]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    return competitions.map((c) => ({
      id: c.id, name: c.name, description: c.description, year: c.year,
      type: c.type || "quran",
      eduGroupId: (c as any).edu_group_id || null,
      maxScore: (c as any).max_score || 100,
      participantsCount: countMap[c.id] || 0, resultsPublished: !!c.results_published,
    }));
  }

  async findOne(id: string) {
    const comp = await this.competitionModel.findOne({ id }).lean();
    if (!comp) throw new NotFoundException("المسابقة غير موجودة");

    const participants = await this.participantModel.find({ competition_id: id }).lean();
    const results = await this.resultModel.find({ competition_id: id }).sort({ rank_position: 1 }).lean();

    const studentIds = participants.map((p) => p.student_id);
    const students = await this.studentModel.find({ id: { $in: studentIds } }).lean();
    const studentMap = Object.fromEntries(
      students.map((s) => [s.id, { name: s.name, national_id: s.national_id, group_id: s.group_id }])
    );

    // جلب أسماء الحلقات
    const groupIds = [...new Set(students.map((s) => s.group_id).filter(Boolean))];
    const groups = await this.groupModel.find({ id: { $in: groupIds } }).lean();
    const groupMap = Object.fromEntries(groups.map((g) => [g.id, g.name]));

    return {
      id: comp.id,
      name: comp.name,
      description: comp.description,
      year: comp.year,
      type: (comp as any).type || "quran",
      eduGroupId: (comp as any).edu_group_id || null,
      maxScore: (comp as any).max_score || 100,
      resultsPublished: !!comp.results_published,
      participants: participants.map((p) => ({
        studentId: p.student_id,
        studentName: studentMap[p.student_id]?.name || p.student_id,
        nationalId: studentMap[p.student_id]?.national_id,
        groupId: studentMap[p.student_id]?.group_id,
        groupName: studentMap[p.student_id]?.group_id ? groupMap[studentMap[p.student_id].group_id] : undefined,
      })),
      results: results.map((r) => ({ student_id: r.student_id, score: r.score, rank: r.rank_position, notes: r.notes })),
    };
  }

  async create(body: {
    name: string; description?: string; year: string;
    maxScore?: number; type?: "quran" | "edu"; eduGroupId?: string;
  }) {
    const id = uuidv4();
    const compType = body.type || "quran";
    await this.competitionModel.create({
      id, name: body.name, description: body.description || null,
      year: body.year, type: compType,
      edu_group_id: body.eduGroupId || null,
      max_score: body.maxScore || 100,
    });

    // إضافة المشاركين تلقائيًا عند الإنشاء
    if (compType === "quran") {
      const students = await this.studentModel.find({ is_waiting: { $ne: true } }).lean();
      if (students.length > 0) {
        const docs = students.map((s) => ({ competition_id: id, student_id: s.id }));
        await this.participantModel.insertMany(docs, { ordered: false }).catch(() => {});
      }
    } else if (compType === "edu" && body.eduGroupId) {
      const refs = await this.eduStudentRefModel.find({ edu_group_id: body.eduGroupId }).lean();
      if (refs.length > 0) {
        const docs = refs.map((r) => ({ competition_id: id, student_id: r.student_id }));
        await this.participantModel.insertMany(docs, { ordered: false }).catch(() => {});
      }
    }

    return { id, name: body.name, year: body.year, type: compType, maxScore: body.maxScore || 100 };
  }

  async update(id: string, body: { name?: string; description?: string; year?: string; maxScore?: number }) {
    const update: any = {};
    if (body.name) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.year) update.year = body.year;
    if (body.maxScore !== undefined) update.max_score = body.maxScore;
    if (Object.keys(update).length === 0) throw new BadRequestException("لا يوجد بيانات");
    const comp = await this.competitionModel.findOneAndUpdate({ id }, update, { new: true }).lean();
    if (!comp) throw new NotFoundException("المسابقة غير موجودة");
    return comp;
  }

  async remove(id: string) {
    await this.competitionModel.deleteOne({ id });
    await this.participantModel.deleteMany({ competition_id: id });
    await this.resultModel.deleteMany({ competition_id: id });
  }

  private async assertTeacherOwnsStudent(user: CurrentUserPayload, studentId: string) {
    if (user.role !== "teacher") return;
    const student = await this.studentModel.findOne({ id: studentId }).lean();
    if (!student) throw new NotFoundException("الطالب غير موجود");
    const groupIds = (user as any).groupIds || [];
    const isRegular = groupIds.includes(student.group_id);
    let isEdu = false;
    if (user.eduGroupId) {
      const ref = await this.eduStudentRefModel.findOne({ edu_group_id: user.eduGroupId, student_id: studentId }).lean();
      if (ref) isEdu = true;
    }
    if (!isRegular && !isEdu) throw new ForbiddenException("ليس لديك صلاحية");
  }

  async addParticipant(user: CurrentUserPayload, competitionId: string, studentId: string) {
    const student = await this.studentModel.findOne({ id: studentId }).lean();
    if (!student) throw new NotFoundException("الطالب غير موجود");
    await this.assertTeacherOwnsStudent(user, studentId);
    await this.participantModel.findOneAndUpdate(
      { competition_id: competitionId, student_id: studentId },
      { competition_id: competitionId, student_id: studentId },
      { upsert: true },
    );
    return { message: "تم الإضافة" };
  }

  async removeParticipant(user: CurrentUserPayload, competitionId: string, studentId: string) {
    const student = await this.studentModel.findOne({ id: studentId }).lean();
    if (!student) throw new NotFoundException("الطالب غير موجود");
    await this.assertTeacherOwnsStudent(user, studentId);
    await this.participantModel.deleteOne({ competition_id: competitionId, student_id: studentId });
    await this.resultModel.deleteOne({ competition_id: competitionId, student_id: studentId });
    return { message: "تم الحذف" };
  }

  // ============================================================================
  // حفظ النتائج وإعلانها
  // ============================================================================
  async saveResults(competitionId: string, results: { studentId: string; score: number; rank?: number; notes?: string }[]) {
    const comp = await this.competitionModel.findOne({ id: competitionId }).lean();
    if (!comp) throw new NotFoundException("المسابقة غير موجودة");
    if (!Array.isArray(results) || results.length === 0) throw new BadRequestException("النتائج مطلوبة");

    const participants = await this.participantModel.find({ competition_id: competitionId }).lean();
    const participantIds = new Set(participants.map((p) => p.student_id));
    const notParticipating = results.filter((r) => !participantIds.has(r.studentId));
    if (notParticipating.length) {
      throw new BadRequestException(
        `الطلاب التالية مش مسجلين كمشاركين: ${notParticipating.map((r) => r.studentId).join(", ")}`,
      );
    }

    const needsAutoRank = results.some((r) => r.rank === undefined || r.rank === null);
    let finalResults = results;
    if (needsAutoRank) {
      const sorted = [...results].sort((a, b) => b.score - a.score);
      finalResults = sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
    }

    await this.resultModel.deleteMany({ competition_id: competitionId });
    const docs = finalResults.map((r) => ({
      competition_id: competitionId, student_id: r.studentId,
      score: r.score, rank_position: r.rank, notes: r.notes || null,
    }));
    await this.resultModel.insertMany(docs);
    await this.competitionModel.updateOne({ id: competitionId }, { results_published: true });

    return { message: "تم الحفظ والإعلان", results: finalResults };
  }

  // ============================================================================
  // جلب نتائج طالب بالرقم القومي (public)
  // ============================================================================
  async getStudentResults(nationalId: string) {
    const student = await this.studentModel.findOne({ national_id: nationalId }).lean();
    if (!student) throw new NotFoundException("لم يُعثر على طالب بهذا الرقم القومي");

    // نتائج المسابقات
    const compResults = await this.resultModel.find({ student_id: student.id }).lean();
    const competitionIds = [...new Set(compResults.map((r) => r.competition_id))];
    const publishedComps = await this.competitionModel
      .find({ id: { $in: competitionIds }, results_published: true })
      .lean();
    const compMap = Object.fromEntries(publishedComps.map((c) => [c.id, c]));

    const competitions = compResults
      .filter((r) => compMap[r.competition_id])
      .map((r) => {
        const comp = compMap[r.competition_id];
        return {
          type: (comp as any).type || "quran",
          competitionId: comp.id,
          competitionName: comp.name,
          year: comp.year,
          maxScore: (comp as any).max_score || 100,
          score: r.score,
          rank: r.rank_position,
        };
      });

    // نتائج الامتحانات التربوية
    const examRecords = await this.examModel.find({ student_id: student.id }).lean();
    // تجميع الامتحانات بحيث كل امتحان يظهر مرة واحدة
    const examMap = new Map<string, any>();
    for (const rec of examRecords) {
      if (!examMap.has(rec.id)) {
        examMap.set(rec.id, {
          examId: rec.id,
          name: rec.name,
          maxScore: rec.max_score,
          score: rec.score,
          date: rec.date,
        });
      }
    }

    return {
      studentName: student.name,
      nationalId: student.national_id,
      competitions,
      exams: [...examMap.values()],
    };
  }
}

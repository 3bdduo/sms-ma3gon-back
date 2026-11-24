// ============================================================
// DTOs المشتركة — shared.dto.ts
// كل الـ endpoints اللي بتاخد body بتستخدم من هنا
// ============================================================
import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, IsBoolean,
  IsUrl, IsEnum, IsArray, ValidateNested, Min, Max, Length,
  Matches, IsIn, Validate, ValidatorConstraint,
  ValidatorConstraintInterface, ValidationArguments,
} from "class-validator";
import { Type } from "class-transformer";
import {
  validateFullName,
  validateEgyptianNationalId,
  validateEgyptianPhone,
} from "../validation.utils";

// ─── Custom Constraints ────────────────────────────────────

@ValidatorConstraint({ name: "IsEgyptianFullName", async: false })
export class IsEgyptianFullNameConstraint implements ValidatorConstraintInterface {
  validate(v: string) { return validateFullName(v).valid; }
  defaultMessage(a: ValidationArguments) { return validateFullName(a.value).message || "الاسم غير صحيح"; }
}

@ValidatorConstraint({ name: "IsEgyptianNid", async: false })
export class IsEgyptianNidConstraint implements ValidatorConstraintInterface {
  validate(v: string) { return validateEgyptianNationalId(v).valid; }
  defaultMessage(a: ValidationArguments) { return validateEgyptianNationalId(a.value).message || "الرقم القومي غير صحيح"; }
}

@ValidatorConstraint({ name: "IsEgyptianPhone", async: false })
export class IsEgyptianPhoneConstraint implements ValidatorConstraintInterface {
  validate(v: string) { if (!v) return true; return validateEgyptianPhone(v).valid; }
  defaultMessage(a: ValidationArguments) { return validateEgyptianPhone(a.value).message || "رقم الهاتف غير صحيح"; }
}

/** YYYY-MM مثل: 2024-03 */
@ValidatorConstraint({ name: "IsYearMonth", async: false })
export class IsYearMonthConstraint implements ValidatorConstraintInterface {
  validate(v: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(v || ""); }
  defaultMessage() { return "الشهر لازم يكون بصيغة YYYY-MM مثل: 2024-03"; }
}

/** YYYY-MM-DD مع تحقق حقيقي من صحة التاريخ */
@ValidatorConstraint({ name: "IsRealDate", async: false })
export class IsRealDateConstraint implements ValidatorConstraintInterface {
  validate(v: string) {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = new Date(v);
    return !isNaN(d.getTime()) && d.toISOString().startsWith(v);
  }
  defaultMessage() { return "التاريخ غير صحيح — استخدم صيغة YYYY-MM-DD"; }
}

// ─── Students DTOs ─────────────────────────────────────────

export class CreateStudentDto {
  @IsString() @IsNotEmpty({ message: "الاسم مطلوب" })
  @Validate(IsEgyptianFullNameConstraint)
  name: string;

  @IsString() @IsNotEmpty({ message: "الرقم القومي مطلوب" })
  @Validate(IsEgyptianNidConstraint)
  national_id: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianPhoneConstraint)
  phone?: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianPhoneConstraint)
  parent_phone?: string;

  @IsOptional() @IsString() @Length(0, 300)
  address?: string;

  @IsOptional() @IsString() @Length(0, 100)
  group_id?: string;

  @IsOptional() @IsString() @Length(0, 100)
  edu_group_id?: string;

  @IsOptional() @IsBoolean()
  waiting?: boolean;

  @IsOptional() @IsNumber() @Min(0)
  monthly_fee?: number;

  @IsOptional() @IsString()
  @Validate(IsRealDateConstraint)
  enrollment_date?: string;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}

export class UpdateStudentDto {
  @IsOptional() @IsString()
  @Validate(IsEgyptianFullNameConstraint)
  name?: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianNidConstraint)
  national_id?: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianPhoneConstraint)
  phone?: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianPhoneConstraint)
  parent_phone?: string;

  @IsOptional() @IsString() @Length(0, 300)
  address?: string;

  @IsOptional() @IsString() @Length(0, 100)
  group_id?: string;

  @IsOptional() @IsString() @Length(0, 100)
  edu_group_id?: string;

  @IsOptional() @IsBoolean()
  waiting?: boolean;

  @IsOptional() @IsNumber() @Min(0)
  monthly_fee?: number;

  @IsOptional() @IsString()
  @Validate(IsRealDateConstraint)
  enrollment_date?: string;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}

export class MoveToGroupDto {
  @IsString() @IsNotEmpty({ message: "groupId مطلوب" })
  groupId: string;
}

export class UpdateMonthlyFeeDto {
  @IsNumber({}, { message: "fee لازم يكون رقم" })
  @Min(0, { message: "الرسوم لا يمكن أن تكون سالبة" })
  fee: number;
}

// ─── Attendance DTOs ───────────────────────────────────────

const ATTENDANCE_STATUSES = [
  "present", "absent", "late", "excused",
  "حاضر", "غائب", "متأخر", "مستأذن",
] as const;

export class MarkAttendanceDto {
  @IsString() @IsNotEmpty() studentId: string;

  @IsString() @IsNotEmpty()
  @Validate(IsRealDateConstraint)
  date: string;

  @IsString()
  @IsIn(ATTENDANCE_STATUSES, { message: `الحالة لازم تكون: ${ATTENDANCE_STATUSES.join(" | ")}` })
  status: string;
}

export class AttendanceEntryDto {
  @IsString() @IsNotEmpty() studentId: string;

  @IsString()
  @IsIn(ATTENDANCE_STATUSES, { message: `الحالة لازم تكون: ${ATTENDANCE_STATUSES.join(" | ")}` })
  status: string;
}

export class MarkBulkAttendanceDto {
  @IsString() @IsNotEmpty()
  @Validate(IsRealDateConstraint)
  date: string;

  @IsArray() @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries: AttendanceEntryDto[];
}

// ─── Memorization DTOs ─────────────────────────────────────

const MEM_TYPES = ["حفظ جديد", "مراجعة قريبة", "مراجعة بعيدة", "تسميع"] as const;
const MEM_RATINGS = ["ممتاز", "جيد جداً", "جيد", "مقبول", "ضعيف"] as const;

export class CreateMemorizationDto {
  @IsString() @IsNotEmpty()
  @Validate(IsRealDateConstraint)
  date: string;

  @IsString()
  @IsIn(MEM_TYPES, { message: `النوع لازم يكون: ${MEM_TYPES.join(" | ")}` })
  type: string;

  @IsString() @IsNotEmpty() @Length(1, 200)
  content: string;

  @IsOptional() @IsString()
  @IsIn(MEM_RATINGS, { message: `التقييم لازم يكون: ${MEM_RATINGS.join(" | ")}` })
  rating?: string;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}

export class UpdateMemorizationDto {
  @IsOptional() @IsString()
  @Validate(IsRealDateConstraint)
  date?: string;

  @IsOptional() @IsString()
  @IsIn(MEM_TYPES, { message: `النوع لازم يكون: ${MEM_TYPES.join(" | ")}` })
  type?: string;

  @IsOptional() @IsString() @Length(1, 200)
  content?: string;

  @IsOptional() @IsString()
  @IsIn(MEM_RATINGS, { message: `التقييم لازم يكون: ${MEM_RATINGS.join(" | ")}` })
  rating?: string;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}

// ─── Payments DTOs ─────────────────────────────────────────

const PAYMENT_STATUSES = ["paid", "unpaid", "partial", "exempt"] as const;

export class UpdatePaymentDto {
  @IsString()
  @IsIn(PAYMENT_STATUSES, { message: `الحالة لازم تكون: ${PAYMENT_STATUSES.join(" | ")}` })
  status: string;

  @IsOptional() @IsNumber() @Min(0, { message: "المبلغ لا يمكن أن يكون سالباً" })
  amount?: number;

  @IsOptional() @IsString()
  @Validate(IsRealDateConstraint)
  paidDate?: string;

  @IsOptional() @IsString() @Length(0, 300)
  note?: string;
}

// ─── Exams DTOs ────────────────────────────────────────────

export class ExamScoreDto {
  @IsString() @IsNotEmpty() studentId: string;

  @IsNumber() @Min(0, { message: "الدرجة لا يمكن أن تكون سالبة" })
  score: number;
}

export class CreateExamDto {
  @IsString() @IsNotEmpty() @Length(1, 100)
  name: string;

  @IsNumber() @Min(1, { message: "الدرجة الكاملة لازم تكون أكبر من صفر" }) @Max(1000)
  maxScore: number;

  @IsString() @IsNotEmpty()
  @Validate(IsRealDateConstraint)
  date: string;

  @IsArray() @ValidateNested({ each: true })
  @Type(() => ExamScoreDto)
  scores: ExamScoreDto[];
}

export class UpdateExamDto {
  @IsOptional() @IsString() @Length(1, 100)
  name?: string;

  @IsOptional() @IsNumber() @Min(1) @Max(1000)
  maxScore?: number;

  @IsOptional() @IsString()
  @Validate(IsRealDateConstraint)
  date?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true })
  @Type(() => ExamScoreDto)
  scores?: ExamScoreDto[];
}

// ─── Competitions DTOs ─────────────────────────────────────

const COMP_TYPES = ["quran", "edu"] as const;

export class CreateCompetitionDto {
  @IsString() @IsNotEmpty() @Length(1, 100)
  name: string;

  @IsIn(COMP_TYPES, { message: "النوع لازم يكون: quran | edu" })
  type: "quran" | "edu";

  /** السنة مثل: 2024 */
  @IsString() @IsNotEmpty()
  @Matches(/^\d{4}$/, { message: "السنة لازم تكون أربعة أرقام مثل: 2024" })
  year: string;

  @IsOptional() @IsString() @Length(0, 500)
  description?: string;

  @IsOptional() @IsNumber() @Min(1) @Max(1000)
  maxScore?: number;

  @IsOptional() @IsString() @Length(0, 100)
  eduGroupId?: string;
}

export class UpdateCompetitionDto {
  @IsOptional() @IsString() @Length(1, 100)
  name?: string;

  @IsOptional() @IsString()
  @IsIn(COMP_TYPES, { message: "النوع لازم يكون: quran | edu" })
  type?: string;

  @IsOptional() @IsString()
  @Matches(/^\d{4}$/, { message: "السنة لازم تكون أربعة أرقام مثل: 2024" })
  year?: string;

  @IsOptional() @IsString() @Length(0, 500)
  description?: string;

  @IsOptional() @IsNumber() @Min(1) @Max(1000)
  maxScore?: number;

  @IsOptional() @IsString() @Length(0, 100)
  eduGroupId?: string;
}

export class CompResultDto {
  @IsString() @IsNotEmpty() studentId: string;
  @IsNumber() @Min(0) score: number;
  @IsOptional() @IsInt() @Min(1) rank?: number;
}

export class SaveResultsDto {
  @IsArray() @ValidateNested({ each: true })
  @Type(() => CompResultDto)
  results: CompResultDto[];
}

// ─── Salaries DTOs ─────────────────────────────────────────

export class SetSalaryConfigDto {
  @IsNumber({}, { message: "baseSalary لازم يكون رقم" })
  @Min(0, { message: "الراتب الأساسي لا يمكن أن يكون سالباً" })
  baseSalary: number;

  @IsOptional() @IsString() @Length(0, 300)
  notes?: string;
}

export class SetSalaryMonthDto {
  @IsOptional() @IsNumber() @Min(0)
  baseSalary?: number;

  @IsOptional() @IsNumber() @Min(0)
  incentive?: number;

  @IsOptional() @IsNumber() @Min(0)
  deduction?: number;

  @IsOptional() @IsString() @Length(0, 300)
  notes?: string;

  @IsOptional() @IsBoolean()
  paid?: boolean;
}

// ─── Settings DTOs ─────────────────────────────────────────

export class UpdateSettingsDto {
  @IsOptional() @IsString() @Length(1, 100)
  schoolName?: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianPhoneConstraint)
  schoolPhone?: string;

  @IsOptional() @IsString() @Length(0, 300)
  schoolAddress?: string;

  @IsOptional() @IsNumber() @Min(0, { message: "الرسوم الشهرية لا يمكن أن تكون سالبة" })
  monthlyFee?: number;

  @IsOptional() @IsString() @Length(6, 100)
  adminPassword?: string;
}

// ─── Blog DTOs ─────────────────────────────────────────────

export class CreateBlogDto {
  @IsString() @IsNotEmpty() @Length(1, 200)
  title: string;

  @IsString() @IsNotEmpty() @Length(1, 50)
  category: string;

  @IsString() @IsNotEmpty()
  content: string;

  @IsOptional() @IsString() @Length(0, 500)
  excerpt?: string;

  @IsOptional() @IsString() @Length(0, 100)
  author?: string;

  @IsOptional() @IsString() @Length(0, 300)
  coverImage?: string;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class UpdateBlogDto {
  @IsOptional() @IsString() @Length(1, 200)
  title?: string;

  @IsOptional() @IsString() @Length(1, 200)
  slug?: string;

  @IsOptional() @IsString() @Length(0, 50)
  category?: string;

  @IsOptional() @IsString() @Length(0, 100)
  author?: string;

  @IsOptional() @IsBoolean()
  published?: boolean;

  @IsOptional() @IsString() @Length(0, 500)
  excerpt?: string;

  @IsOptional() @IsString()
  content?: string;
}

// ─── Media DTOs ────────────────────────────────────────────

export class CreateMediaDto {
  @IsString() @IsNotEmpty() @Length(1, 200)
  title: string;

  @IsOptional() @IsString() @Length(0, 1000)
  description?: string;

  @IsString() @IsNotEmpty()
  @IsUrl({}, { message: "رابط الفيديو غير صحيح" })
  video_url: string;

  @IsOptional() @IsString()
  @IsUrl({}, { message: "رابط الصورة المصغرة غير صحيح" })
  thumbnail_url?: string;

  @IsOptional() @IsString() @Length(0, 50)
  track?: string;

  @IsOptional() @IsString() @Length(0, 50)
  level?: string;

  @IsOptional() @IsString() @Length(0, 100)
  teacher_name?: string;

  @IsOptional() @IsBoolean()
  is_live?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class UpdateMediaDto {
  @IsOptional() @IsString() @Length(1, 200)
  title?: string;

  @IsOptional() @IsString() @Length(0, 1000)
  description?: string;

  @IsOptional() @IsString()
  @IsUrl({}, { message: "رابط الفيديو غير صحيح" })
  video_url?: string;

  @IsOptional() @IsString()
  @IsUrl({}, { message: "رابط الصورة المصغرة غير صحيح" })
  thumbnail_url?: string;

  @IsOptional() @IsString() @Length(0, 50)
  track?: string;

  @IsOptional() @IsString() @Length(0, 50)
  level?: string;

  @IsOptional() @IsString() @Length(0, 100)
  teacher_name?: string;

  @IsOptional() @IsBoolean()
  is_live?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

// ─── Contact DTO ───────────────────────────────────────────

export class SubmitContactDto {
  @IsString() @IsNotEmpty() @Length(2, 100)
  name: string;

  @IsString() @IsNotEmpty()
  @Matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: "البريد الإلكتروني غير صحيح" })
  email: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianPhoneConstraint)
  phone?: string;

  @IsOptional() @IsString() @Length(0, 100)
  subject?: string;

  @IsString() @IsNotEmpty() @Length(10, 2000)
  message: string;
}

// ─── Public Register DTO ───────────────────────────────────

export class PublicRegisterDto {
  @IsString() @IsNotEmpty({ message: "الاسم مطلوب" })
  @Validate(IsEgyptianFullNameConstraint)
  name: string;

  @IsString() @IsNotEmpty({ message: "الرقم القومي مطلوب" })
  @Validate(IsEgyptianNidConstraint)
  nationalId: string;

  @IsString() @IsNotEmpty({ message: "رقم الهاتف مطلوب" })
  @Validate(IsEgyptianPhoneConstraint)
  phone: string;

  @IsString() @IsNotEmpty({ message: "السورة الحالية مطلوبة" }) @Length(1, 100)
  currentSurah: string;

  @IsString() @IsNotEmpty({ message: "كمية الحفظ مطلوبة" }) @Length(1, 100)
  memorizedAmount: string;
}

// ─── Groups DTOs ───────────────────────────────────────────

export class CreateGroupDto {
  @IsString() @IsNotEmpty({ message: "اسم الحلقة مطلوب" }) @Length(1, 100)
  name: string;

  @IsOptional() @IsString() @Length(0, 100)
  teacherId?: string;
}

export class UpdateGroupDto {
  @IsOptional() @IsString() @Length(1, 100)
  name?: string;

  @IsOptional() @IsString() @Length(0, 100)
  teacherId?: string;
}

export class TransferStudentDto {
  @IsString() @IsNotEmpty() studentId: string;
  @IsString() @IsNotEmpty() toGroupId: string;
}

export class ChangeTeacherDto {
  @IsString() @IsNotEmpty() newTeacherId: string;
}

// ─── Edu-Groups DTOs ───────────────────────────────────────

export class CreateEduGroupDto {
  @IsString() @IsNotEmpty({ message: "اسم المجموعة مطلوب" }) @Length(1, 100)
  name: string;

  @IsString() @IsNotEmpty({ message: "اسم المعلم مطلوب" }) @Length(1, 100)
  teacherName: string;

  @IsString() @IsNotEmpty({ message: "كلمة مرور المعلم مطلوبة" }) @Length(6, 100)
  teacherPassword: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianNidConstraint)
  nationalId?: string;

  @IsOptional() @IsString()
  @Validate(IsEgyptianPhoneConstraint)
  phone?: string;

  @IsOptional() @IsString() @Length(0, 50)
  teacherUsername?: string;
}

export class UpdateEduGroupDto {
  @IsOptional() @IsString() @Length(1, 100)
  name?: string;

  @IsOptional() @IsString() @Length(0, 100)
  teacherId?: string;

  @IsOptional() @IsString() @Length(0, 300)
  description?: string;
}

export class EduTransferStudentDto {
  @IsString() @IsNotEmpty() studentId: string;
  @IsString() @IsNotEmpty() toGroupId: string;
}

export class EduChangeTeacherDto {
  @IsString() @IsNotEmpty() newTeacherId: string;
}

// ─── Edu-Attendance DTOs ───────────────────────────────────

export class EduAttendanceEntryDto {
  @IsString() @IsNotEmpty() studentId: string;

  @IsString()
  @IsIn(
    ["present", "absent", "late", "excused", "حاضر", "غائب", "متأخر", "مستأذن"],
    { message: "الحالة لازم تكون: present | absent | late | excused أو حاضر | غائب | متأخر | مستأذن" },
  )
  status: string;
}

export class RecordEduAttendanceDto {
  @IsString() @IsNotEmpty()
  @Validate(IsRealDateConstraint)
  date: string;

  @IsArray() @ValidateNested({ each: true })
  @Type(() => EduAttendanceEntryDto)
  records: EduAttendanceEntryDto[];
}

// ─── Teacher Profiles DTOs ─────────────────────────────────

export class CreateTeacherProfileDto {
  @IsString() @IsNotEmpty({ message: "اسم المعلم مطلوب" }) @Length(1, 100)
  name: string;

  @IsOptional() @IsString() @IsUrl({}, { message: "رابط الصورة غير صحيح" })
  photoUrl?: string;

  @IsOptional() @IsString() @Length(0, 100)
  specialty?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  ijazahs?: string[];

  @IsOptional() @IsString() @Length(0, 1000)
  bio?: string;

  @IsOptional() @IsString() @Length(0, 100)
  linkedUsername?: string;

  @IsOptional() @IsInt() @Min(0)
  displayOrder?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

export class UpdateTeacherProfileDto {
  @IsOptional() @IsString() @Length(1, 100)
  name?: string;

  @IsOptional() @IsString() @IsUrl({}, { message: "رابط الصورة غير صحيح" })
  photoUrl?: string;

  @IsOptional() @IsString() @Length(0, 100)
  specialty?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  ijazahs?: string[];

  @IsOptional() @IsString() @Length(0, 1000)
  bio?: string;

  @IsOptional() @IsString() @Length(0, 100)
  linkedUsername?: string;

  @IsOptional() @IsInt() @Min(0)
  displayOrder?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}

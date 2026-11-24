import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Model } from "mongoose";
import { Teacher, EduGroup } from "../../../schemas";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(Teacher.name) private readonly teacherModel: Model<Teacher>,
    @InjectModel(EduGroup.name) private readonly eduGroupModel: Model<EduGroup>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("jwt.secret"),
    });
  }

  // اللي بيرجع من هنا هو اللي بيتحط في req.user
  async validate(payload: any) {
    // للمعلم: نتأكد إن الحساب لسه موجود في الداتابيز
    // لو اتحذف أو اتعطّل — التوكن يرفض فوراً
    if (payload.role === "teacher" && payload.username) {
      const stillExists =
        (await this.teacherModel.exists({ username: payload.username }).lean()) ||
        (await this.eduGroupModel.exists({ teacher_username: payload.username }).lean());
      if (!stillExists) {
        throw new UnauthorizedException("الحساب لم يعد موجوداً، يرجى تسجيل الدخول مجدداً");
      }
    }
    return payload;
  }
}

import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Response } from "express";
import { Error as MongooseError } from "mongoose";

// فيلتر موحّد لكل الأخطاء عشان شكل الاستجابة يفضل زي القديم: { error: "..." }
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "خطأ في السيرفر";

    if (exception instanceof HttpException) {
      // أخطاء HTTP العادية (NestJS built-in)
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === "string") message = res;
      else if (typeof res === "object" && res !== null) {
        const anyRes = res as any;
        message = Array.isArray(anyRes.message) ? anyRes.message.join(", ") : anyRes.message || anyRes.error || message;
      }
    } else if (exception instanceof MongooseError.ValidationError) {
      // أخطاء Mongoose Validation → 400 برسالة عامة، التفاصيل في اللوج فقط
      status = HttpStatus.BAD_REQUEST;
      message = "بيانات غير صالحة";
      this.logger.warn(`MongooseValidationError: ${(exception as MongooseError.ValidationError).message}`);
    } else if (exception instanceof MongooseError.CastError) {
      // CastError (مثلاً ObjectId غلط) → 400 برسالة عامة
      status = HttpStatus.BAD_REQUEST;
      message = "معرّف غير صالح";
      this.logger.warn(`MongooseCastError: ${(exception as MongooseError.CastError).message}`);
    } else {
      // أي خطأ غير متوقع → 500، نسجّل الـ stack في اللوج بس، مش للعميل
      const err = exception as any;
      const isMongoError = err?.name === "MongoServerError" || err?.name === "MongoError";
      if (isMongoError && err?.code === 11000) {
        // Duplicate key → 409 برسالة عامة
        status = HttpStatus.CONFLICT;
        message = "البيانات موجودة بالفعل";
        this.logger.warn(`MongoDuplicateKey: ${err?.message}`);
      } else {
        // خطأ داخلي حقيقي — نسجّل فقط ولا نرجّع تفاصيل
        this.logger.error(exception instanceof Error ? exception.stack : String(exception));
      }
    }

    if (status !== HttpStatus.NO_CONTENT) {
      response.status(status).json({ error: message });
    } else {
      response.status(status).send();
    }
  }
}

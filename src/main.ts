import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  const corsOrigins = (config.get<string[]>("corsOrigins") || []).map((o) =>
    o.replace(/\/$/, "")
  );
  // Regex يسمح لأي localhost بأي بورت (للتطوير المحلي)
  const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Server-to-server أو Postman
      const cleanOrigin = origin.replace(/\/$/, "");
      if (localhostRegex.test(origin) || localhostRegex.test(cleanOrigin)) return callback(null, true); // أي localhost
      if (corsOrigins.includes(cleanOrigin)) return callback(null, true); // الدومينات المسموحة
      if (
        /^https:\/\/quranschoolshababalmostqabal(-[a-z0-9-]+)?\.vercel\.app$/.test(
          cleanOrigin
        )
      ) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  });

  // مسار /health بره البادئة /api/v1 زي ما كان بالظبط في النسخة القديمة
  app.setGlobalPrefix("api/v1", { exclude: ["health"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  const port = config.get<number>("port") || 3000;
  await app.listen(port, "0.0.0.0");
  logger.log(`🕌 Quran School API (NestJS) — يعمل على المنفذ ${port}`);
  logger.log(`📍 http://localhost:${port}/api/v1`);
  logger.log(`✅ Health: http://localhost:${port}/health`);
}

bootstrap();

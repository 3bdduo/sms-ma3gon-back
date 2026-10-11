// v3 - Gemini 3.8 flash upgrade
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import express from "express";
import { AppModule } from "../src/app.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";

const expressApp = express();
let isInitialized = false;

async function bootstrapServer() {
  if (isInitialized) return;

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  const config = app.get(ConfigService);

  const corsOrigins = (config.get<string[]>("corsOrigins") || []).map((o) =>
    o.replace(/\/$/, "")
  );
  const localhostRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, "");
      if (localhostRegex.test(cleanOrigin)) return callback(null, true);
      if (corsOrigins.includes(cleanOrigin)) return callback(null, true);
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

  app.setGlobalPrefix("api/v1", { exclude: ["health"] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: false, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
  isInitialized = true;
}

export default async (req: any, res: any) => {
  await bootstrapServer();
  expressApp(req, res);
};
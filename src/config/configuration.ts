function normalizeMongoUri(raw?: string): string | undefined {
  const uri = (raw || "").trim();
  if (!uri) return undefined;
  const [base, query] = uri.split("?");
  const cleanBase = base.replace(/\/+$/, "");
  const parts = cleanBase.split("/");
  // parts[0] is 'mongodb+srv:', parts[1] is '', parts[2] is 'host'
  if (parts.length <= 3 || !parts[3]) {
    return cleanBase + "/ma3gon" + (query ? "?" + query : "");
  }
  return uri;
}

export default () => {
  const jwtSecret = process.env.JWT_SECRET;

  // Fail-fast في الإنتاج لو JWT_SECRET مش موجود أو لسه على القيمة الافتراضية
  if (process.env.NODE_ENV === "production") {
    if (!jwtSecret || jwtSecret === "change-this-secret-in-production") {
      throw new Error(
        "🚨 [config] JWT_SECRET غير موجود أو لسه على القيمة الافتراضية — لازم تضبطه في متغيرات الإنتاج",
      );
    }
    const adminPass = process.env.ADMIN_DEFAULT_PASSWORD;
    if (!adminPass || adminPass === "CHANGE_ME_ON_FIRST_RUN" || adminPass === "Admin123") {
      throw new Error(
        "🚨 [config] ADMIN_DEFAULT_PASSWORD لسه على القيمة الافتراضية — غيّره في متغيرات الإنتاج",
      );
    }
  }

  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    mongoUri: normalizeMongoUri(process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL),
    jwt: {
      secret: jwtSecret,
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    },
    // لو مش موجود نستخدم placeholder واضح — مش "Admin123" hardcoded
    adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || "CHANGE_ME_ON_FIRST_RUN",
    geminiApiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, "") : undefined,
    geminiModel: (process.env.GEMINI_MODEL || "gemini-flash-latest").trim(),
    corsOrigins: Array.from(
      new Set([
        "https://ma3gon.vercel.app",
        "https://quranschoolshababalmostqabal.vercel.app",
        "https://ma3gon-quran.vercel.app",
        "https://sms-ma3gon-front.vercel.app",
        "https://3bdduo-bit.github.io",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        ...(process.env.CORS_ORIGINS
          ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim())
          : []),
      ])
    )
      .map((s) => s.replace(/\/$/, ""))
      .filter(Boolean),
  };
};

// database/prisma-client.js
// Singleton Prisma client dùng chung cho toàn bộ ứng dụng.
// Kết nối đến PostgreSQL qua DATABASE_URL trong biến môi trường.
// Sử dụng @prisma/adapter-pg cho Prisma 7.

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let prisma = null;

/**
 * Lấy instance PrismaClient (singleton).
 * Tạo kết nối mới nếu chưa có.
 */
export function getPrisma() {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/quickreport";
    const adapter = new PrismaPg({ connectionString: databaseUrl });
    prisma = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["warn", "error"],
    });
  }
  return prisma;
}

/**
 * Ngắt kết nối Prisma client (dùng cho graceful shutdown).
 */
export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

export default { getPrisma, disconnectPrisma };
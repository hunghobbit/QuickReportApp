// prisma.config.ts
// Prisma 7 configuration — chứa datasource config thay vì trong schema.prisma
// Xem: https://pris.ly/d/config-datasource

import { defineConfig } from "@prisma/config";

// Sử dụng DATABASE_URL từ biến môi trường để hỗ trợ cả local dev và production (Render)
// Render sẽ tự động cung cấp DATABASE_URL từ service database
const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/quickreport";

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});
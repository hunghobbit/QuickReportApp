// prisma.config.js
// Prisma 7 configuration — chứa datasource config thay vì trong schema.prisma
// Xem: https://pris.ly/d/config-datasource
import "dotenv/config"
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: env('DATABASE_URL'),
  },
});
// database/migrate.js
// Script migration cho Prisma ORM với PostgreSQL.
// Chạy: node database/migrate.js
//
// Prisma 7 yêu cầu config datasource trong prisma.config.ts thay vì schema.prisma
// Script này đồng bộ schema với database và generate Prisma Client.

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function log(message, type = "INFO") {
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${timestamp}] [${type}] ${message}`);
}

function runCommand(command, cwd = rootDir) {
  log(`Running: ${command}`);
  try {
    execSync(command, {
      cwd,
      stdio: "inherit",
      env: { ...process.env },
      timeout: 60000,
    });
    return true;
  } catch (error) {
    log(`Command failed: ${error.message}`, "ERROR");
    return false;
  }
}

async function main() {
  console.log("=".repeat(60));
  log("QuickReportApp - Database Migration (PostgreSQL)");
  console.log("=".repeat(60));

  // 1. Kiểm tra DATABASE_URL
  if (!process.env.DATABASE_URL) {
    // Thử đọc từ file .env
    const envPath = resolve(rootDir, ".env");
    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, "utf-8");
      const match = envContent.match(/DATABASE_URL\s*=\s*"(.+?)"/);
      if (match) {
        process.env.DATABASE_URL = match[1].trim();
        log(`DATABASE_URL loaded from .env file`);
      }
    }
  }

  if (!process.env.DATABASE_URL) {
    log(
      "DATABASE_URL is required but not found. Set it in .env file or environment variables.",
      "ERROR",
    );
    log(
      'Example: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quickreport"',
    );
    process.exit(1);
  }

  log(`Connecting to database...`);

  // 2. Đồng bộ schema với database (Prisma 7 dùng prisma.config.ts)
  log("Syncing database schema (prisma db push)...");
  const pushSuccess = runCommand("npx prisma db push");
  if (!pushSuccess) {
    log(
      "Failed to sync database schema. Check that PostgreSQL is running and DATABASE_URL is correct.",
      "ERROR",
    );
    process.exit(1);
  }
  log("Database schema synced successfully.");

  // 3. Generate Prisma Client
  log("Generating Prisma Client...");
  const generateSuccess = runCommand("npx prisma generate");
  if (!generateSuccess) {
    log("Failed to generate Prisma Client.", "ERROR");
    process.exit(1);
  }
  log("Prisma Client generated successfully.");

  console.log("=".repeat(60));
  log("Migration completed successfully!");
  console.log("=".repeat(60));
}

main().catch((error) => {
  log(`Unexpected error: ${error.message}`, "ERROR");
  process.exit(1);
});
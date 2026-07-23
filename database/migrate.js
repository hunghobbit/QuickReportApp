// database/migrate.js
// Migration runner: applies SQL migration files in alphabetical order.
// Uses CREATE TABLE IF NOT EXISTS and checks for existing columns before
// ALTER TABLE, so it is safe to run on an already-existing database.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dbAll, dbExec, saveDatabase, ensureInitialized } from "./db.js";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);
const MIGRATIONS_DIR = path.join(__dirName, "migrations");

/**
 * Get list of existing column names for a table.
 * Returns a Set of lowercase column names.
 */
function getTableColumns(tableName) {
  return dbAll(`PRAGMA table_info(${tableName})`).then((rows) =>
    new Set(rows.map((r) => r.name.toLowerCase()))
  );
}

/**
 * Run a single migration file.
 * Supports CREATE TABLE IF NOT EXISTS and ALTER TABLE ADD COLUMN (with
 * existence check) so migrations are idempotent.
 */
async function runMigration(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");

  // Split into statements by semicolon (naive but sufficient for our migrations).
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    // Handle ALTER TABLE ADD COLUMN with existence check
    const alterMatch = stmt.match(
      /^ALTER\s+TABLE\s+(\w+)\s+ADD\s+COLUMN\s+(\w+)\s+(.+)$/i,
    );
    if (alterMatch) {
      const tableName = alterMatch[1];
      const columnName = alterMatch[2].toLowerCase();
      const columns = await getTableColumns(tableName);
      if (columns.has(columnName)) {
        console.log(`  ⏭️  Cột ${columnName} đã tồn tại trong bảng ${tableName}, bỏ qua.`);
        continue;
      }
    }

    await dbExec(stmt);
  }
}

async function main() {
  console.log("🚀 Bắt đầu migration...");

  // Initialize database before running migrations
  await ensureInitialized();

  // Ensure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log("⚠️  Thư mục migrations không tồn tại, tạo mới.");
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log("✅ Migration hoàn tất (không có file migration nào).");
    return;
  }

  const migrationFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (migrationFiles.length === 0) {
    console.log("⚠️  Không có file migration nào.");
    return;
  }

  for (const file of migrationFiles) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    console.log(`  📄 Áp dụng migration: ${file}`);
    try {
      await runMigration(filePath);
      console.log(`  ✅ Hoàn thành: ${file}`);
    } catch (err) {
      console.error(`  ❌ Lỗi migration ${file}:`, err.message);
      throw err;
    }
  }

  console.log("🎉 Tất cả migration đã được áp dụng.");
  
  // Save database after migrations
  saveDatabase();
  console.log("💾 Database đã được lưu.");
}

main()
  .catch((err) => {
    console.error("❌ Migration thất bại:", err);
    process.exit(1);
  })
  .finally(() => {
    // sql.js: save database before exit
    saveDatabase();
    console.log("💾 Database đã được lưu.");
  });

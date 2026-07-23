// database/db.js
// Singleton SQLite connection. Uses sqlite3 (async) to avoid native build
// requirements on machines without a C++ toolchain.
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

// Allow override via environment variable; default to storage/data/quick-report.db
const DEFAULT_DB_PATH = path.join(__dirName, "..", "storage", "data", "quick-report.db");
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

// Ensure the directory exists so sqlite3 can open/create the file.
const dbDir = path.dirname(DB_PATH);
fs.mkdirSync(dbDir, { recursive: true });

// Open in verbose mode for easier debugging.
sqlite3.verbose();

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Không thể kết nối SQLite:", err.message);
    process.exit(1);
  }
  console.log(`✅ Đã kết nối SQLite tại ${DB_PATH}`);
});

// Enable WAL mode for better concurrent read/write performance.
db.run("PRAGMA journal_mode = WAL;", (err) => {
  if (err) console.error("⚠️  Không thể bật WAL mode:", err.message);
});

export { db, DB_PATH };
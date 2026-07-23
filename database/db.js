// database/db.js
// Singleton SQLite connection using sql.js for cross-platform compatibility.
// sql.js is a pure JavaScript implementation of SQLite (no native compilation needed).
import initSqlJs from "sql.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

// Allow override via environment variable; default to storage/data/quick-report.db
const DEFAULT_DB_PATH = path.join(__dirName, "..", "storage", "data", "quick-report.db");
const DB_PATH = process.env.DB_PATH || DEFAULT_DB_PATH;

// Ensure the directory exists so SQLite can open/create the file.
const dbDir = path.dirname(DB_PATH);
fs.mkdirSync(dbDir, { recursive: true });

// Initialize SQL.js and load/create database
let db = null;
let SQL = null;

async function initializeDatabase() {
  if (db) return db;

  SQL = await initSqlJs();

  // Try to load existing database file
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log(`✅ Đã tải SQLite database từ ${DB_PATH}`);
    } else {
      db = new SQL.Database();
      console.log(`✅ Đã tạo SQLite database mới tại ${DB_PATH}`);
    }
  } catch (err) {
    console.error("❌ Không thể khởi tạo SQLite:", err.message);
    process.exit(1);
  }

  // Enable WAL mode for better concurrent read/write performance
  try {
    db.run("PRAGMA journal_mode = WAL;");
    console.log("✅ WAL mode đã được bật");
  } catch (err) {
    console.error("⚠️  Không thể bật WAL mode:", err.message);
  }

  return db;
}

// Save database to file
export function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error("❌ Không thể lưu database:", err.message);
  }
}

// Helper functions to wrap sql.js calls in Promises for consistency
export function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      db.run(sql, params);
      // Get the last insert rowid for INSERT operations
      const lastIdResult = db.exec("SELECT last_insert_rowid() as lastID");
      const lastID = lastIdResult[0]?.values[0]?.[0] || null;
      resolve({ 
        changes: db.getRowsModified(),
        lastInsertRowid: lastID
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        resolve(row);
      } else {
        stmt.free();
        resolve(null);
      }
    } catch (err) {
      reject(err);
    }
  });
}

export function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const rows = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      resolve(rows);
    } catch (err) {
      reject(err);
    }
  });
}

export function dbExec(sql) {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        throw new Error("Database chưa được khởi tạo. Gọi ensureInitialized() trước.");
      }
      db.exec(sql);
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

// Get database instance (must be initialized first)
export function getDb() {
  if (!db) {
    throw new Error("Database chưa được khởi tạo. Gọi initializeDatabase() trước.");
  }
  return db;
}

// Initialize database on import (for backward compatibility)
let initialized = false;
export async function ensureInitialized() {
  if (!initialized) {
    await initializeDatabase();
    // Only mark as initialized if db is not null
    if (db) {
      initialized = true;
    } else {
      throw new Error("Database initialization failed.");
    }
  }
}

export { DB_PATH };

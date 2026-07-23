// database/export-run-repository.js
// Repository pattern cho bảng export_runs.
// Quản lý lịch sử xuất Excel và chống xuất trùng.
import { dbRun, dbGet, dbAll } from "./db.js";

/**
 * Chuyển đổi một hàng SQLite thành đối tượng export run.
 */
function mapRowToExportRun(row) {
  if (!row) return null;
  return {
    id: row.id,
    reportDate: row.report_date,
    exportType: row.export_type,
    exportedAt: row.exported_at,
    fileName: row.file_name,
    filePath: row.file_path,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

/**
 * Tạo một bản ghi export run mới.
 * @param {object} exportRun - { reportDate, exportType, exportedAt, fileName, filePath, status, errorMessage? }
 * @returns {Promise<object>} Export run vừa tạo
 */
export function createExportRun(exportRun) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    const sql = `
      INSERT INTO export_runs (
        report_date, export_type, exported_at, file_name, file_path, status, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      exportRun.reportDate,
      exportRun.exportType || "manual",
      exportRun.exportedAt || now,
      exportRun.fileName,
      exportRun.filePath,
      exportRun.status || "success",
      exportRun.errorMessage || "",
      now,
    ];

    dbRun(sql, values)
      .then((result) => {
        // Lấy bản ghi vừa tạo
        return dbGet("SELECT * FROM export_runs WHERE id = ?", [result.lastInsertRowid]);
      })
      .then((row) => resolve(mapRowToExportRun(row)))
      .catch(reject);
  });
}

/**
 * Kiểm tra xem đã có lượt xuất thành công cho ngày và loại xuất chưa.
 * @param {string} reportDate - YYYY-MM-DD
 * @param {string} exportType - 'manual' | 'automatic'
 * @returns {Promise<boolean>} true nếu đã có lượt xuất thành công
 */
export function hasSuccessfulExport(reportDate, exportType = "manual") {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) as count
      FROM export_runs
      WHERE report_date = ?
        AND export_type = ?
        AND status = 'success'
    `;
    dbGet(sql, [reportDate, exportType])
      .then((row) => resolve(row.count > 0))
      .catch(reject);
  });
}

/**
 * Lấy lịch sử xuất theo ngày báo cáo.
 * @param {string} reportDate - YYYY-MM-DD
 * @returns {Promise<object[]>} Mảng export runs
 */
export function getExportRunsByDate(reportDate) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM export_runs
      WHERE report_date = ?
      ORDER BY exported_at DESC
    `;
    dbAll(sql, [reportDate])
      .then((rows) => resolve(rows.map(mapRowToExportRun)))
      .catch(reject);
  });
}

/**
 * Lấy lịch sử xuất theo khoảng ngày.
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<object[]>} Mảng export runs
 */
export function getExportRunsByDateRange(startDate, endDate) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM export_runs
      WHERE report_date >= ? AND report_date <= ?
      ORDER BY report_date DESC, exported_at DESC
    `;
    dbAll(sql, [startDate, endDate])
      .then((rows) => resolve(rows.map(mapRowToExportRun)))
      .catch(reject);
  });
}

/**
 * Lấy lượt xuất gần nhất theo ngày và loại.
 * @param {string} reportDate - YYYY-MM-DD
 * @param {string} exportType - 'manual' | 'automatic'
 * @returns {Promise<object|null>} Export run gần nhất hoặc null
 */
export function getLatestExportRun(reportDate, exportType = "manual") {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM export_runs
      WHERE report_date = ?
        AND export_type = ?
      ORDER BY exported_at DESC
      LIMIT 1
    `;
    dbGet(sql, [reportDate, exportType])
      .then((row) => resolve(mapRowToExportRun(row)))
      .catch(reject);
  });
}

// Export default để dễ dàng thay thế
export default {
  createExportRun,
  hasSuccessfulExport,
  getExportRunsByDate,
  getExportRunsByDateRange,
  getLatestExportRun,
};
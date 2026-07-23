// database/sqlite-report-repository.js
// Repository pattern cho bảng reports.
// Interface được thiết kế để dễ dàng thay thế bằng supabase-report-repository
// ở giai đoạn 2 mà không thay đổi service layer.
import { db } from "./db.js";
import { getReportStatus, REPORT_STATUS } from "../services/report-status.js";

// Các cột trong bảng reports (trùng khớp với migration 001)
const COLUMNS = [
  "id",
  "report_date",
  "stt",
  "hoTen_ThuocCtyDonVi",
  "xuongGiao",
  "xuongNhan",
  "soThe",
  "giay_to",
  "loaiPhuongTien_BSX_BKSRomooc",
  "soCont_SoSeal",
  "chiTietHangHoa",
  "soPhieu",
  "gioVao",
  "gioRa",
  "ghiChu",
  "raw_text",
  "status",
  "created_at",
  "updated_at",
];

const INSERT_COLUMNS = COLUMNS.filter((c) => c !== "id");
const INSERT_PLACEHOLDERS = INSERT_COLUMNS.map(() => "?").join(", ");

/**
 * Chuyển đổi một hàng SQLite thành đối tượng report.
 * - `id` trong DB là khóa chính auto-increment.
 * - `giay_to` trong DB là "Loại giấy tờ - Số giấy tờ" → đổi tên thành `businessId`
 *   để tránh trùng tên với `id` của bản ghi.
 */
function mapRowToReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    reportDate: row.report_date,
    stt: row.stt,
    hoTen_ThuocCtyDonVi: row.hoTen_ThuocCtyDonVi,
    xuongGiao: row.xuongGiao,
    xuongNhan: row.xuongNhan,
    soThe: row.soThe,
    businessId: row.giay_to,
    loaiPhuongTien_BSX_BKSRomooc: row.loaiPhuongTien_BSX_BKSRomooc,
    soCont_SoSeal: row.soCont_SoSeal,
    chiTietHangHoa: row.chiTietHangHoa,
    soPhieu: row.soPhieu,
    gioVao: row.gioVao,
    gioRa: row.gioRa,
    ghiChu: row.ghiChu,
    rawText: row.raw_text,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Chuyển đổi đối tượng report từ service thành mảng giá trị cho INSERT.
 * Tự động tính status nếu không được cung cấp.
 */
function reportToValues(report) {
  const now = new Date().toISOString();
  const data = { ...report };

  // Tự động tính status từ gioRa nếu chưa có
  if (!data.status) {
    data.status = getReportStatus(data);
  }

  return [
    data.reportDate || "",
    data.stt || "",
    data.hoTen_ThuocCtyDonVi || "",
    data.xuongGiao || "",
    data.xuongNhan || "",
    data.soThe || "",
    data.businessId || "", // sẽ được lưu vào cột giay_to
    data.loaiPhuongTien_BSX_BKSRomooc || "",
    data.soCont_SoSeal || "",
    data.chiTietHangHoa || "",
    data.soPhieu || "",
    data.gioVao || "",
    data.gioRa || "",
    data.ghiChu || "",
    data.rawText || "",
    data.status,
    now,
    now,
  ];
}

// ---------------------------------------------------------------------------
// Repository methods
// ---------------------------------------------------------------------------

/**
 * Tạo một báo cáo mới.
 * @param {object} report - { reportDate, stt, hoTen_ThuocCtyDonVi, ..., rawText, businessId }
 * @returns {Promise<object>} Report vừa tạo (có id, createdAt, updatedAt)
 */
export function createReport(report) {
  return new Promise((resolve, reject) => {
    const values = reportToValues(report);
    const sql = `INSERT INTO reports (${INSERT_COLUMNS.join(", ")}) VALUES (${INSERT_PLACEHOLDERS})`;

    db.run(sql, values, function (err) {
      if (err) return reject(err);

      // Lấy bản ghi vừa tạo
      db.get("SELECT * FROM reports WHERE id = ?", [this.lastID], (err, row) => {
        if (err) return reject(err);
        resolve(mapRowToReport(row));
      });
    });
  });
}

/**
 * Lấy danh sách báo cáo theo ngày.
 * @param {string} reportDate - Định dạng YYYY-MM-DD
 * @returns {Promise<object[]>} Mảng report
 */
export function getReportsByDate(reportDate) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM reports WHERE report_date = ? ORDER BY id ASC";
    db.all(sql, [reportDate], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(mapRowToReport));
    });
  });
}

/**
 * Lấy chi tiết một báo cáo theo ID.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export function getReportById(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM reports WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(mapRowToReport(row));
    });
  });
}

/**
 * Cập nhật một báo cáo.
 * Tự động tính lại status từ gioRa và cập nhật updated_at.
 * @param {number} id
 * @param {object} updates - Các trường cần cập nhật
 * @returns {Promise<object|null>} Report sau khi cập nhật, hoặc null nếu không tìm thấy
 */
export function updateReport(id, updates) {
  return new Promise((resolve, reject) => {
    // Lấy bản ghi hiện tại để merge
    db.get("SELECT * FROM reports WHERE id = ?", [id], (err, existing) => {
      if (err) return reject(err);
      if (!existing) return resolve(null);

      const merged = {
        ...mapRowToReport(existing),
        ...updates,
        id: existing.id, // giữ nguyên id bản ghi
      };

      // Tự động tính lại status từ gioRa
      merged.status = getReportStatus(merged);

      const now = new Date().toISOString();
      const sql = `
        UPDATE reports SET
          stt = ?,
          hoTen_ThuocCtyDonVi = ?,
          xuongGiao = ?,
          xuongNhan = ?,
          soThe = ?,
          giay_to = ?,
          loaiPhuongTien_BSX_BKSRomooc = ?,
          soCont_SoSeal = ?,
          chiTietHangHoa = ?,
          soPhieu = ?,
          gioVao = ?,
          gioRa = ?,
          ghiChu = ?,
          raw_text = ?,
          status = ?,
          updated_at = ?
        WHERE id = ?
      `;
      const values = [
        merged.stt || "",
        merged.hoTen_ThuocCtyDonVi || "",
        merged.xuongGiao || "",
        merged.xuongNhan || "",
        merged.soThe || "",
        merged.businessId || "",
        merged.loaiPhuongTien_BSX_BKSRomooc || "",
        merged.soCont_SoSeal || "",
        merged.chiTietHangHoa || "",
        merged.soPhieu || "",
        merged.gioVao || "",
        merged.gioRa || "",
        merged.ghiChu || "",
        merged.rawText || "",
        merged.status,
        now,
        id,
      ];

      db.run(sql, values, (err) => {
        if (err) return reject(err);

        db.get("SELECT * FROM reports WHERE id = ?", [id], (err, row) => {
          if (err) return reject(err);
          resolve(mapRowToReport(row));
        });
      });
    });
  });
}

/**
 * Xóa một báo cáo theo ID.
 * @param {number} id
 * @returns {Promise<boolean>} true nếu đã xóa
 */
export function deleteReport(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM reports WHERE id = ?", [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

/**
 * Lấy danh sách báo cáo theo ngày và trạng thái.
 * @param {string} reportDate - YYYY-MM-DD
 * @param {string} status - 'pending' | 'completed'
 * @returns {Promise<object[]>}
 */
export function getReportsByStatus(reportDate, status) {
  return new Promise((resolve, reject) => {
    const sql =
      "SELECT * FROM reports WHERE report_date = ? AND status = ? ORDER BY id ASC";
    db.all(sql, [reportDate, status], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(mapRowToReport));
    });
  });
}

// Export default để dễ dàng thay thế bằng repository khác
export default {
  createReport,
  getReportsByDate,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByStatus,
};
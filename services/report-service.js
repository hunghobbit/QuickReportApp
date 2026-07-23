// services/report-service.js
// Service layer trung gian giữa API handlers và Repository.
// Kết hợp validation + status rule + repository để xử lý nghiệp vụ báo cáo.
import { validateRecordPayload } from "./record-validation.js";
import { getReportStatus } from "./report-status.js";
import { sanitizeText, normalizeTime } from "../configs/record-schema.js";
import * as repo from "../database/sqlite-report-repository.js";

// Các trường được phép cập nhật (tương ứng với payloadFields trong schema,
// nhưng không bao gồm các trường chỉ đọc như id, status, createdAt, updatedAt)
const ALLOWED_UPDATE_FIELDS = [
  "stt",
  "hoTen_ThuocCtyDonVi",
  "xuongGiao",
  "xuongNhan",
  "soThe",
  "businessId",
  "loaiPhuongTien_BSX_BKSRomooc",
  "soCont_SoSeal",
  "chiTietHangHoa",
  "soPhieu",
  "gioVao",
  "gioRa",
  "ghiChu",
  "rawText",
];

/**
 * Lấy payload thực tế từ body request.
 * Hỗ trợ cả body trực tiếp và body chứa tempRecord (tương thích với frontend cũ).
 */
function extractPayload(body) {
  if (!body || typeof body !== "object") return null;
  return body.tempRecord ?? body;
}

/**
 * Tạo một báo cáo mới.
 *
 * @param {object} body - Request body: { reportDate, tempRecord?, mode? }
 * @param {"draft"|"complete"} [mode="draft"] - Chế độ validation
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function createReport(body, mode = "draft") {
  try {
    const { reportDate, mode: bodyMode } = body || {};
    const effectiveMode = bodyMode || mode;

    if (!reportDate) {
      return { success: false, error: "Missing required field: reportDate." };
    }

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
      return {
        success: false,
        error: "reportDate must be in YYYY-MM-DD format.",
      };
    }

    const payload = extractPayload(body);
    if (!payload) {
      return { success: false, error: "Request body must be an object." };
    }

    // Validate record payload using existing validator
    const validation = validateRecordPayload(payload, effectiveMode);
    if (!validation.ok) {
      return { success: false, error: validation.error };
    }

    // Build report object with reportDate
    const report = {
      reportDate,
      ...validation.record,
      rawText: payload.rawText || "",
      businessId: payload.id || "",
      status: validation.status || getReportStatus(validation.record),
    };

    const created = await repo.createReport(report);
    return { success: true, data: created };
  } catch (err) {
    console.error("[report-service] createReport error:", err);
    return { success: false, error: err.message || "Failed to create report." };
  }
}

/**
 * Lấy danh sách báo cáo theo ngày.
 *
 * @param {string} reportDate - Định dạng YYYY-MM-DD
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getReportsByDate(reportDate) {
  try {
    if (!reportDate) {
      return { success: false, error: "Missing required query parameter: date." };
    }

    const reports = await repo.getReportsByDate(reportDate);
    return { success: true, data: reports };
  } catch (err) {
    console.error("[report-service] getReportsByDate error:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch reports.",
    };
  }
}

/**
 * Lấy chi tiết một báo cáo theo ID.
 *
 * @param {number} id
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function getReportById(id) {
  try {
    const report = await repo.getReportById(id);
    if (!report) {
      return { success: false, error: "Report not found." };
    }
    return { success: true, data: report };
  } catch (err) {
    console.error("[report-service] getReportById error:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch report.",
    };
  }
}

/**
 * Cập nhật một báo cáo.
 * Tự động tính lại status dựa trên gioRa sau khi cập nhật.
 *
 * @param {number} id
 * @param {object} body - Request body: các field cần cập nhật
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function updateReport(id, body) {
  try {
    // Lấy bản ghi hiện tại để kiểm tra tồn tại
    const existing = await repo.getReportById(id);
    if (!existing) {
      return { success: false, error: "Report not found." };
    }

    const payload = extractPayload(body) || body;
    if (!payload || typeof payload !== "object") {
      return { success: false, error: "Request body must be an object." };
    }

    // Lọc chỉ lấy các field được phép cập nhật
    const updates = {};
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in payload) {
        updates[field] = payload[field];
      }
    }

    // Frontend gửi field "id" (form field), backend lưu vào "businessId" (DB column giay_to)
    if ("id" in payload && !("businessId" in updates)) {
      updates.businessId = payload.id;
    }

    // Validate các field nếu có
    // stt: phải là số nếu được cung cấp
    if ("stt" in updates) {
      const sttStr = sanitizeText(updates.stt);
      if (sttStr && !/^\d+$/.test(sttStr)) {
        return { success: false, error: "Field stt must be numeric." };
      }
      updates.stt = sttStr;
    }

    // gioVao: phải là thời gian hợp lệ nếu được cung cấp
    if ("gioVao" in updates) {
      const normalized = normalizeTime(updates.gioVao);
      if (!normalized && sanitizeText(updates.gioVao)) {
        return {
          success: false,
          error: "Field gioVao must be a valid time (HH:MM).",
        };
      }
      updates.gioVao = normalized;
    }

    // gioRa: nếu được cung cấp, phải là thời gian hợp lệ hoặc rỗng
    if ("gioRa" in updates) {
      const gioRaStr = sanitizeText(updates.gioRa);
      if (gioRaStr) {
        const normalized = normalizeTime(gioRaStr);
        if (!normalized) {
          return {
            success: false,
            error: "Field gioRa must be a valid time (HH:MM).",
          };
        }
        updates.gioRa = normalized;
      } else {
        updates.gioRa = "";
      }
    }

    // Sanitize các string fields
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (field in updates && typeof updates[field] === "string") {
        updates[field] = sanitizeText(updates[field]);
      }
    }

    // Nếu không có field nào được cập nhật
    if (Object.keys(updates).length === 0) {
      return { success: false, error: "No valid fields to update." };
    }

    // Cập nhật qua repository (tự động tính lại status từ gioRa)
    const updated = await repo.updateReport(id, updates);
    if (!updated) {
      return { success: false, error: "Report not found." };
    }

    return { success: true, data: updated };
  } catch (err) {
    console.error("[report-service] updateReport error:", err);
    return {
      success: false,
      error: err.message || "Failed to update report.",
    };
  }
}

/**
 * Lấy danh sách báo cáo theo ngày và trạng thái.
 *
 * @param {string} reportDate - YYYY-MM-DD
 * @param {string} status - 'pending' | 'completed'
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getReportsByStatus(reportDate, status) {
  try {
    if (!reportDate) {
      return { success: false, error: "Missing required parameter: reportDate." };
    }
    if (!status) {
      return { success: false, error: "Missing required parameter: status." };
    }
    if (!["pending", "completed"].includes(status)) {
      return {
        success: false,
        error: "Status must be 'pending' or 'completed'.",
      };
    }

    const reports = await repo.getReportsByStatus(reportDate, status);
    return { success: true, data: reports };
  } catch (err) {
    console.error("[report-service] getReportsByStatus error:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch reports.",
    };
  }
}

export default {
  createReport,
  getReportsByDate,
  getReportById,
  updateReport,
  getReportsByStatus,
};
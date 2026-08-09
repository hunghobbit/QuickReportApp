// server/ai/report-parser.js
// Parses the AI-generated report text into structured fields.
// The AI outputs a plain-text report following the template:
//   🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng
//   • Ngày :
//   • Họ Tên :
//   • Cty :
//   • Xưởng giao :
//   • Xưởng nhận :
//   • Phương tiện :
//   • BSX :
//   • Người liên hệ :
//   • Mục đích ra/vào xưởng :
//   • Số phiếu MHRC/Số lượng/Chủng loại:
//   • Seal/Niêm phong:
//   • Số cont:
//   • Thời gian vào :
//   • Thời gian ra :
//   Báo cáo hết!

/**
 * Mapping from Vietnamese labels in the report template to field keys.
 * Labels are matched case-insensitively after stripping the bullet "•" prefix.
 */
const LABEL_TO_FIELD = {
  "Ngày": "ngay",
  "Họ Tên": "hoTen",
  "Cty": "congTy",
  "Loại giấy tờ - Số giấy tờ": "giayToSo",
  "CCCD/GPLX": "giayToSo",
  "Xưởng giao": "xuongGiao",
  "Xưởng nhận": "xuongNhan",
  "Phương tiện": "phuongTien",
  "BSX": "bienSo",
  "Người liên hệ": "nguoiLienHe",
  "Mục đích ra/vào xưởng": "mucDich",
  "Số phiếu MHRC/Số lượng/Chủng loại": "soPhieuHangHoa",
  "Seal/Niêm phong": "seal",
  "Số cont": "soCont",
  "Thời gian vào": "gioVao",
  "Thời gian ra": "gioRa",
};

/**
 * Parse the AI-generated report text into a structured object.
 *
 * Handles the new bullet-point format:
 *   • Label : value
 *
 * @param {string} reportText - The raw text output from the AI model.
 * @returns {object} Parsed fields object with keys from LABEL_TO_FIELD.
 */
export function parseReportFromAI(reportText) {
  const fields = {};

  // Initialize all fields to empty string
  for (const field of Object.values(LABEL_TO_FIELD)) {
    fields[field] = "";
  }


  if (!reportText || typeof reportText !== "string") {
    return fields;
  }

  const lines = reportText.split("\n");

  for (const line of lines) {
    let trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Skip header and footer lines
    if (trimmedLine.startsWith("🚖")) continue;
    if (trimmedLine === "Báo cáo hết!") continue;

    // Strip leading bullet point "•" (and optional surrounding spaces)
    if (trimmedLine.startsWith("•")) {
      trimmedLine = trimmedLine.replace(/^•\s*/, "").trim();
    }

    if (!trimmedLine) continue;

    // Try to match "Label : value" or "Label: value" pattern
    const colonIndex = trimmedLine.indexOf(":");
    if (colonIndex === -1) continue;

    const label = trimmedLine.substring(0, colonIndex).trim();
    const value = trimmedLine.substring(colonIndex + 1).trim();

    // Find matching field key
    for (const [reportLabel, fieldKey] of Object.entries(LABEL_TO_FIELD)) {
      if (label.toLowerCase() === reportLabel.toLowerCase()) {
        fields[fieldKey] = value;
        break;
      }
    }
  }

  return fields;
}

/**
 * Convert parsed AI fields into the record format used by the existing
 * report-service and record-schema.
 *
 * Maps new AI field names → record-schema field names:
 *   ngay → (date, not directly in record-schema; kept for reference)
 *   hoTen → hoTen
 *  id → id (from userInput or OCR)
 *   congTy → thuocCtyDonVi
 *  xuongGiao → xuongGiao
 *  xuongNhan → xuongNhan
 *   phuongTien → loaiPhuongTien
 *   bienSo → bks
 *   nguoiLienHe → (appended to ghiChu)
 *   mucDich → (appended to ghiChu)
 *   soPhieuHangHoa → soPhieu (and chiTietHangHoa if separable)
 *   seal → soSeal
 *   soCont → soCont
 *   gioVao → gioVao
 *   gioRa → gioRa
 *
 * @param {object} aiFields - Fields from parseReportFromAI()
 * @returns {object} Record in the format expected by record-schema
 */
export function mapAIFieldsToRecord(aiFields, originalInput = {}) {
  // Build ghiChu from contact person + purpose if present
  const ghiChuParts = [];
  if (aiFields.nguoiLienHe) {
    ghiChuParts.push(`Người liên hệ: ${aiFields.nguoiLienHe}`);
  }
  if (aiFields.mucDich) {
    ghiChuParts.push(`Mục đích: ${aiFields.mucDich}`);
  }
  // The "Số phiếu MHRC/Số lượng/Chủng loại" field may contain both the
  // ticket number and goods description.  We store the full value in soPhieu
  // and also attempt to split into soPhieu + chiTietHangHoa.
  const soPhieuHangHoa = aiFields.soPhieuHangHoa || "";
  let soPhieu = soPhieuHangHoa;
  let chiTietHangHoa = "";

  // If the value contains a "/" separator, try to split:
  //   "MHRC12345 / 100 thùng / Nước ngọt" → soPhieu + chiTietHangHoa
  const slashIndex = soPhieuHangHoa.indexOf("/");
  if (slashIndex > 0) {
    soPhieu = soPhieuHangHoa.substring(0, slashIndex).trim();
    chiTietHangHoa = soPhieuHangHoa.substring(slashIndex + 1).trim();
  }

  return {
    hoTen: aiFields.hoTen || "",
    id:
      (originalInput.ocr && originalInput.ocr.idCard) ||
      (originalInput.userInput && originalInput.userInput.cccd) ||
      aiFields.giayToSo ||
      "",
    bks: aiFields.bienSo || "",
    bksRomooc: "",
    soCont: aiFields.soCont || "",
    soSeal: aiFields.seal || "",
    chiTietHangHoa: chiTietHangHoa || soPhieuHangHoa,
    thuocCtyDonVi: aiFields.congTy || "",
    xuongGiao: aiFields.xuongGiao || "",
    xuongNhan: aiFields.xuongNhan || "",
    soPhieu: soPhieu,
    loaiPhuongTien: aiFields.phuongTien || "",
    gioVao: aiFields.gioVao || "",
    gioRa: aiFields.gioRa || "",
    ngay: aiFields.ngay || "",
    nguoiLienHe: aiFields.nguoiLienHe || "",
    mucDich: aiFields.mucDich || "",
    ghiChu: ghiChuParts.join(" | "),
  };
}

export default {
  parseReportFromAI,
  mapAIFieldsToRecord,
};
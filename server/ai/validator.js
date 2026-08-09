// server/ai/validator.js
// Validates AI-generated report fields.
// Checks for:
//   - Found vs missing fields (for the "quick confirm" step)
//   - Time format validation (gioVao, gioRa)
//   - License plate format hints
//   - Seal number format hints
// Does NOT reject — only produces warnings for the user to review.
//
// New report format — "Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng":
//   • Ngày
//   • Họ Tên
//   • Cty
//   • Phương tiện
//   • BSX
//   • Người liên hệ
//   • Mục đích ra/vào xưởng
//   • Số phiếu MHRC/Số lượng/Chủng loại
//   • Seal/Niêm phong
//   • Thời gian vào
//   • Thời gian ra

import { normalizeTime } from "../../configs/record-schema.js";

/**
 * All field keys that the AI report should contain.
 * Matches the new bullet-point report format.
 */
export const ALL_FIELDS = [
  { key: "ngay", label: "Ngày", required: true },
  { key: "hoTen", label: "Họ Tên", required: true },
  { key: "congTy", label: "Cty", required: true },
  { key: "giayToSo", label: "Loại giấy tờ - Số giấy tờ", required: false },
  { key: "xuongGiao", label: "Xưởng giao", required: false },
  { key: "xuongNhan", label: "Xưởng nhận", required: false },
  { key: "phuongTien", label: "Phương tiện", required: false },
  { key: "bienSo", label: "BSX", required: true },
  { key: "nguoiLienHe", label: "Người liên hệ", required: false },
  { key: "mucDich", label: "Mục đích ra/vào xưởng", required: true },
  { key: "soPhieuHangHoa", label: "Số phiếu MHRC/Số lượng/Chủng loại", required: true },
  { key: "seal", label: "Seal/Niêm phong", required: false },
  { key: "soCont", label: "Số cont", required: false },
  { key: "gioVao", label: "Thời gian vào", required: true },
  { key: "gioRa", label: "Thời gian ra", required: false },
];

/**
 * Validate AI-generated report fields.
 * Produces:
 *   - fields: normalized fields (times normalized)
 *   - found: list of field labels that have values
 *   - missing: list of field labels that are empty
 *   - warnings: list of warning messages for the user
 *
 * @param {object} rawFields - Parsed fields from report-parser.js
 * @returns {{ fields: object, found: string[], missing: string[], warnings: string[] }}
 */
export function validateReportFields(rawFields) {
  const fields = { ...rawFields };
  const found = [];
  const missing = [];
  const warnings = [];

  // Normalize time fields
  if (fields.gioVao) {
    const normalized = normalizeTime(fields.gioVao);
    if (!normalized) {
      warnings.push(`Giờ vào không hợp lệ: "${fields.gioVao}"`);
    }
    fields.gioVao = normalized;
  }

  if (fields.gioRa) {
    const normalized = normalizeTime(fields.gioRa);
    if (!normalized && fields.gioRa.trim()) {
      warnings.push(`Giờ ra không hợp lệ: "${fields.gioRa}"`);
    }
    fields.gioRa = normalized;
  }

  // Normalize date field (accept DD/MM/YYYY or YYYY-MM-DD)
  if (fields.ngay) {
    const dateValue = fields.ngay.trim();
    const dmyMatch = dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const ymdMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dmyMatch) {
      const [, dd, mm, yyyy] = dmyMatch;
      fields.ngay = `${dd.padStart(2, "0")}/${mm.padStart(2, "0")}/${yyyy}`;
    } else if (ymdMatch) {
      const [, yyyy, mm, dd] = ymdMatch;
      fields.ngay = `${dd}/${mm}/${yyyy}`;
    } else {
      warnings.push(`Ngày không hợp lệ: "${fields.ngay}"`);
    }
  }

  // Check each field
  for (const field of ALL_FIELDS) {
    const value = (fields[field.key] || "").trim();
    if (value) {
      found.push(field.label);

      // Field-specific format checks (warnings only, not errors)
      if (field.key === "bienSo") {
        // Vietnamese license plate: e.g. 51F-12345, 59C-123.45
        if (!/^\d{2}[A-Z]-\d{3,5}(\.\d{2})?$/.test(value)) {
          warnings.push(`Biển số có thể sai format: "${value}"`);
        }
      }

      if (field.key === "seal") {
        // Seal number: typically 6-8 digits
        if (!/^\d{6,8}$/.test(value)) {
          warnings.push(`Số seal có thể sai format: "${value}"`);
        }
      }

      if (field.key === "soCont") {
        // Container number: typically 4 letters + 7 digits (e.g. TCLU1234567)
        if (!/^[A-Z]{4}\d{7}$/.test(value)) {
          warnings.push(`Sơ cont có thể sai format: ${value}`);
        }
      }
    } else {
      missing.push(field.label);
    }
  }

  return {
    fields,
    found,
    missing,
    warnings,
  };
}

export default {
  validateReportFields,
  ALL_FIELDS,
};
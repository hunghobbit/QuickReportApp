// server/ai/buildInput.js
// Builds a plain-text prompt for the AI model using the user input and report template.
// This keeps the input in a format that works well for OCR-heavy multimodal prompts.

import { prompt as systemPrompt } from "./prompt.js";

/**
 * Build the report template string that defines the expected output format.
 */
export function buildReportTemplate() {
  return [
    "🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng",
    "• Ngày : ",
    "• Họ Tên : ",
    "• Cty : ",
    "• Loại giấy tờ - Số giấy tờ : ",
    "• Phương tiện : ",
    "• Xưởng giao : ",
    "• Xưởng nhận : ",
    "• BSX : ",
    "• Người liên hệ : ",
    "• Mục đích ra/vào xưởng : ",
    "• Số phiếu MHRC/Số lượng/Chủng loại: ",
    "• Seal/Niêm phong: ",
    "• Số cont: ",
    "• Thời gian vào : ",
    "• Thời gian ra : ",
    "Báo cáo hết!",
  ].join("\n");
}

function asText(value) {
  return String(value ?? "").trim();
}

function formatOcrValue(label, value) {
  const text = asText(value);
  if (!text) return `${label}:`;
  return `${label}:\n${text}`;
}

/**
 * Build plain-text input for the AI model.
 *
 * @param {object} params
 * @param {object} params.userInput - Manual user input (companyName, transportCompany)
 * @param {object} params.ocr - OCR text from each image type
 * @returns {string} Plain-text prompt to send as user message content
 */
export function buildInput({ userInput = {}, ocr = {} } = {}) {
  const reportTemplate = buildReportTemplate();
  const companyName = asText(userInput.companyName);
  const transportCompany = asText(userInput.transportCompany);
  const goodsDetails = asText(userInput.goodsDetails);
  const reason = asText(userInput.reason);

  const ocrLines = [
    "DỮ LIỆU OCR",
    "",
    formatOcrValue("CCCD/GPLX", ocr.idCard),
    "",
    formatOcrValue("Biển số xe", ocr.licensePlate),
    "",
    formatOcrValue("Container", ocr.container),
    "",
    formatOcrValue("Seal/Niêm phong", ocr.seal),
    "",
    formatOcrValue("Hóa đơn / Phiếu", ocr.invoice),
    "",
    formatOcrValue("Hàng hóa", ocr.goods),
  ].join("\n");

  return [
    "DỮ LIỆU NGƯỜI DÙNG",
    "",
    "Công ty:",
    companyName || "",
    "",
    "Đơn vị vận chuyển:",
    transportCompany || "",
    "",
    "Lý do / Mục đích:",
    reason || "",
    "",
    "Hàng hóa bổ sung:",
    goodsDetails || "",
    "",
    "==================",
    "",
    "MẪU BÁO CÁO",
    "",
    reportTemplate,
    "",
    "==================",
    "",
    "YÊU CẦU",
    "",
    "- Đọc tất cả ảnh.",
    "- Điền đầy đủ mẫu.",
    "- Không bịa.",
    "- Không chắc để trống.",
    "",
    ocrLines,
  ].join("\n");
}

/**
 * Build the messages array for the LLM API call.
 * Combines the system prompt with the plain-text user input.
 */
export function buildPromptMessages({ userInput = {}, ocr = {} } = {}) {
  const userMessage = buildInput({ userInput, ocr });

  return {
    system: systemPrompt,
    user: userMessage,
  };
}

export default {
  buildReportTemplate,
  buildInput,
  buildPromptMessages,
};

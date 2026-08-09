// server/ai/ai.service.js
// AI Report Generator Service — gọi Google GenAI API để tạo báo cáo.
// Sử dụng @google/genai (đã có trong package.json dependencies).
// Kiến trúc: System Prompt (cố định) + User Input (động) → LLM → Report
//
// Hỗ trợ 2 chế độ:
//   1. Text-only: generateReport({ userInput, ocr }) — nhận text OCR
//   2. Multimodal: generateReportFromImages({ userInput, images }) — nhận ảnh

import { GoogleGenAI } from "@google/genai";
import { prompt as systemPrompt } from "./prompt.js";
import { buildPromptMessages, buildReportTemplate } from "./buildInput.js";
import { parseReportFromAI, mapAIFieldsToRecord } from "./report-parser.js";
import { validateReportFields } from "./validator.js";

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemma-3n-e4b-it:free";
const OPENROUTER_API_KEY = (process.env.OPENROUTER_API_KEY || "").trim();
const HAS_REAL_OPENROUTER_KEY = Boolean(
  OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "your_openrouter_api_key_here",
);

function resolveAIProvider() {
  const configuredProvider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const hasOpenRouterKey = HAS_REAL_OPENROUTER_KEY;

  if (configuredProvider === "openrouter" && hasOpenRouterKey) return "openrouter";
  if (configuredProvider === "gemini" && hasGeminiKey) return "gemini";
  if (hasOpenRouterKey) return "openrouter";
  if (hasGeminiKey) return "gemini";
  return "gemini";
}

function formatAIError(error) {
  const message = extractProviderErrorMessage(error);
  const normalized = message.toLowerCase();

  if (isTemporaryUnavailableError(message)) {
    return "Dich vu AI dang qua tai tam thoi. Vui long thu lai sau it phut.";
  }

  if (
    normalized.includes("resource_exhausted") ||
    normalized.includes("prepayment credits are depleted") ||
    normalized.includes("quota") ||
    normalized.includes("429")
  ) {
    return "AI provider quota has been exhausted. Please add credits or switch to a different API key/model.";
  }

  if (
    normalized.includes("missing") ||
    normalized.includes("invalid") ||
    normalized.includes("unauthorized") ||
    normalized.includes("api key")
  ) {
    return "AI credentials are missing or invalid. Check GEMINI_API_KEY or OPENROUTER_API_KEY in the .env file.";
  }

  return message || "Failed to generate report with AI.";
}

function extractProviderErrorMessage(error) {
  if (!error) return "";

  if (typeof error === "string") {
    return readErrorMessageFromString(error);
  }

  const directMessage = error?.message;
  if (typeof directMessage === "string" && directMessage.trim()) {
    return readErrorMessageFromString(directMessage);
  }

  return String(error || "");
}

function readErrorMessageFromString(rawText = "") {
  const text = String(rawText || "").trim();
  if (!text) return "";

  try {
    const parsed = JSON.parse(text);
    const providerMessage = parsed?.error?.message || parsed?.message;
    if (providerMessage) return String(providerMessage);
  } catch {
    // Keep original text when message is not JSON.
  }

  return text;
}

function isTemporaryUnavailableError(message = "") {
  const normalized = String(message || "").toLowerCase();
  if (!normalized) return false;

  return (
    normalized.includes("currently experiencing high demand") ||
    normalized.includes("spikes in demand") ||
    normalized.includes("unavailable") ||
    normalized.includes("service unavailable") ||
    normalized.includes("status\":\"unavailable\"") ||
    (normalized.includes("503") && normalized.includes("error"))
  );
}

function getAIErrorStatusCode(error) {
  const message = extractProviderErrorMessage(error);
  if (isTemporaryUnavailableError(message)) {
    return 503;
  }

  const normalized = message.toLowerCase();
  if (
    normalized.includes("resource_exhausted") ||
    normalized.includes("prepayment credits are depleted") ||
    normalized.includes("quota") ||
    normalized.includes("429")
  ) {
    return 429;
  }

  if (
    normalized.includes("missing") ||
    normalized.includes("invalid") ||
    normalized.includes("unauthorized") ||
    normalized.includes("api key")
  ) {
    return 401;
  }

  return 500;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithTransientRetry(action, { retries = 1, delayMs = 800 } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      const message = extractProviderErrorMessage(error);
      const canRetry = attempt < retries && isTemporaryUnavailableError(message);

      if (!canRetry) {
        throw error;
      }

      await wait(delayMs * (attempt + 1));
    }
  }

  throw lastError;
}

function extractOpenRouterText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .join("\n");
  }
  if (content && typeof content === "object" && typeof content.text === "string") {
    return content.text;
  }
  return "";
}

function normalizePlaceholderText(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.:,;!]/g, "")
    .replace(/\s+/g, " ");
}

function isGenericPlaceholderValue(value = "") {
  const normalized = normalizePlaceholderText(value);
  if (!normalized) return true;

  return [
    "xuong giao",
    "xuong nhan",
    "cong ty",
    "don vi van chuyen",
    "transport company",
    "company",
  ].includes(normalized);
}

function replaceBulletValue(reportText, label, nextValue) {
  if (!nextValue) return reportText;

  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^\\s*[•-]?\\s*${escapedLabel}\\s*:\\s*)(.*)$`, "gim");

  return reportText.replace(pattern, (full, prefix, value) => {
    if (!isGenericPlaceholderValue(value) && String(value || "").trim() !== "") {
      return full;
    }
    return `${prefix}${nextValue}`;
  });
}

function enforceResolvedValuesInReportText(reportText, resolved = {}) {
  let nextReport = reportText;

  nextReport = replaceBulletValue(nextReport, "Xưởng giao", resolved.xuongGiao);
  nextReport = replaceBulletValue(nextReport, "Xưởng nhận", resolved.xuongNhan);
  nextReport = replaceBulletValue(nextReport, "Cty", resolved.congTy);

  return nextReport;
}

async function callOpenRouter(messages, { temperature = 0.1, maxOutputTokens = 1024 } = {}) {
  const apiKey = OPENROUTER_API_KEY;
  if (!apiKey || !HAS_REAL_OPENROUTER_KEY) {
    throw new Error("Missing or invalid OPENROUTER_API_KEY environment variable.");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "QuickReportApp",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature,
      max_tokens: maxOutputTokens,
      provider: {
        allow_fallbacks: true,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || "OpenRouter request failed.";
    throw new Error(message);
  }

  return extractOpenRouterText(payload?.choices?.[0]?.message?.content || "");
}

/**
 * Khởi tạo Google GenAI client singleton.
 * Sử dụng API key từ biến môi trường GEMINI_API_KEY hoặc GOOGLE_API_KEY.
 */
let aiClient = null;

function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable.",
      );
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

/**
 * Model name to use for text generation.
 * Fallback to a model that remains broadly available for existing Gemini accounts.
 */
const DEFAULT_MODEL = process.env.AI_MODEL || "gemini-2.0-flash";

/**
 * Generate a report from OCR text data + user input using AI.
 * Chế độ text-only: nhận text OCR đã được extract từ ảnh.
 *
 * @param {object} params
 * @param {object} params.userInput - { companyName, transportCompany }
 * @param {object} params.ocr - { idCard, licensePlate, container, seal, invoice, goods }
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 *   data: { report: string, fields: object, warnings: string[] }
 */
export async function generateReport({ userInput = {}, ocr = {} } = {}) {
  try {
    const { system, user } = buildPromptMessages({ userInput, ocr });
    const activeProvider = resolveAIProvider();

    let rawOutput = "";

    if (activeProvider === "openrouter") {
      rawOutput = await runWithTransientRetry(
        () =>
          callOpenRouter(
            [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            {
              temperature: 0.1,
              maxOutputTokens: 4096,
            },
          ),
        { retries: 1, delayMs: 800 },
      );
    } else {
      const client = getAIClient();
      const response = await runWithTransientRetry(
        () =>
          client.models.generateContent({
            model: DEFAULT_MODEL,
            contents: user,
            config: {
              systemInstruction: system,
              temperature: 0.1, // Low temperature for factual extraction
              maxOutputTokens: 4096,
            },
          }),
        { retries: 1, delayMs: 800 },
      );
      rawOutput = response.text || "";
    }

    if (!rawOutput.trim()) {
      return {
        success: false,
        error: "AI returned empty response.",
      };
    }

    // Parse the AI output into structured fields
    const sanitizedReport = enforceResolvedValuesInReportText(rawOutput, {
      congTy: userInput.companyName || "",
    });

    const fields = parseReportFromAI(sanitizedReport);

    // Validate and check for missing/conflicting data
    const validation = validateReportFields(fields);

    return {
      success: true,
      data: {
        report: sanitizedReport.trim(),
        fields: validation.fields,
        warnings: validation.warnings,
        found: validation.found,
        missing: validation.missing,
      },
    };
  } catch (error) {
    console.error("[ai.service] generateReport error:", error);
    return {
      success: false,
      error: formatAIError(error),
      statusCode: getAIErrorStatusCode(error),
    };
  }
}

/**
 * Generate a report from images + user input using AI (multimodal).
 * Chế độ multimodal: gửi ảnh trực tiếp cho Gemini, AI tự OCR + generate.
 *
 * @param {object} params
 * @param {object} params.userInput - { companyName, transportCompany }
 * @param {Array<{data: string, mimeType: string}>} params.images - Mảng ảnh base64
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 *   data: { report: string, fields: object, warnings: string[], found: string[], missing: string[] }
 */
export async function generateReportFromImages({
  userInput = {},
  images = [],
} = {}) {
  try {
    if (!images || images.length === 0) {
      return {
        success: false,
        error: "No images provided. At least one image is required.",
      };
    }

    const activeProvider = resolveAIProvider();
    const reportTemplate = buildReportTemplate();

    const reportType = String(userInput.reportType || "").trim();
    const team = String(userInput.team || "").trim();
    const companyName = String(userInput.companyName || "").trim();
    const transportCompany = String(userInput.transportCompany || "").trim();
    const goodsDetails = String(userInput.goodsDetails || "").trim();

    const isExport = reportType === "Xuất";
    const explicitXuongGiao = String(userInput.xuongGiao || "").trim();
    const explicitXuongNhan = String(userInput.xuongNhan || "").trim();

    const resolvedXuongGiao =
      explicitXuongGiao ||
      (isExport ? (team || companyName) : companyName);
    const resolvedXuongNhan =
      explicitXuongNhan ||
      (isExport ? companyName : (team || companyName));

    const structuredText = [
      "DỮ LIỆU NGƯỜI DÙNG",
      "",
      "Loại báo cáo:",
      reportType,
      "",
      "Team người dùng:",
      team,
      "",
      "Xưởng giao:",
      resolvedXuongGiao,
      "",
      "Xưởng nhận:",
      resolvedXuongNhan,
      "",
      "Công ty:",
      companyName,
      "",
      "Đơn vị vận chuyển:",
      transportCompany,
      "",
      "Lý do / Mục đích:",
      userInput.reason || "",
      "",
      "Hàng hóa bổ sung:",
      goodsDetails,
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
    ].join("\n");

    let rawOutput = "";

    if (activeProvider === "openrouter") {
      const content = [
        { type: "text", text: structuredText },
        ...images
          .filter((img) => img.data && img.mimeType)
          .map((img) => ({
            type: "image_url",
            image_url: {
              url: `data:${img.mimeType};base64,${img.data}`,
            },
          })),
      ];

      rawOutput = await runWithTransientRetry(
        () =>
          callOpenRouter(
            [
              { role: "system", content: systemPrompt },
              { role: "user", content },
            ],
            {
              temperature: 0.1,
              maxOutputTokens: 4096,
            },
          ),
        { retries: 1, delayMs: 800 },
      );
    } else {
      const client = getAIClient();
      const contents = [
        {
          role: "user",
          parts: [
            { text: structuredText },
            ...images
              .filter((img) => img.data && img.mimeType)
              .map((img) => ({
                inlineData: {
                  mimeType: img.mimeType,
                  data: img.data,
                },
              })),
          ],
        },
      ];

      const response = await runWithTransientRetry(
        () =>
          client.models.generateContent({
            model: DEFAULT_MODEL,
            contents,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.1, // Low temperature for factual extraction
              maxOutputTokens: 4096, // Higher limit for multimodal
            },
          }),
        { retries: 1, delayMs: 800 },
      );

      rawOutput = response.text || "";
    }

    if (!rawOutput.trim()) {
      return {
        success: false,
        error: "AI returned empty response.",
      };
    }

    const sanitizedReport = enforceResolvedValuesInReportText(rawOutput, {
      xuongGiao: resolvedXuongGiao,
      xuongNhan: resolvedXuongNhan,
      congTy: companyName,
    });

    // Parse the AI output into structured fields
    const fields = parseReportFromAI(sanitizedReport);

    // Validate and check for missing/conflicting data
    const validation = validateReportFields(fields);

    // Map AI fields to record format, including CCCD from original input
    const record = mapAIFieldsToRecord(fields, { userInput, ocr: { idCard: userInput.cccd || "" } });

    if (!record.chiTietHangHoa && goodsDetails) {
      record.chiTietHangHoa = goodsDetails;
    }

    if (!record.ghiChu && userInput.reason) {
      record.ghiChu = userInput.reason;
    }

    if (!record.xuongGiao && resolvedXuongGiao) {
      record.xuongGiao = resolvedXuongGiao;
    }

    if (!record.xuongNhan && resolvedXuongNhan) {
      record.xuongNhan = resolvedXuongNhan;
    }

    return {
      success: true,
      data: {
        report: sanitizedReport.trim(),
        fields: validation.fields,
        warnings: validation.warnings,
        found: validation.found,
        missing: validation.missing,
        record,
      },
    };
  } catch (error) {
    console.error("[ai.service] generateReportFromImages error:", error);
    return {
      success: false,
      error: formatAIError(error),
      statusCode: getAIErrorStatusCode(error),
    };
  }
}

/**
 * Check if AI service is configured (API key available).
 * @returns {boolean}
 */
export function isAIConfigured() {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const openrouterConfigured = Boolean(
    OPENROUTER_API_KEY && OPENROUTER_API_KEY !== "your_openrouter_api_key_here",
  );
  return geminiConfigured || openrouterConfigured;
}

export { resolveAIProvider, formatAIError, getAIErrorStatusCode };

export default {
  generateReport,
  generateReportFromImages,
  isAIConfigured,
  resolveAIProvider,
  formatAIError,
};

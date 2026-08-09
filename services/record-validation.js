import {
  RECORD_SCHEMA,
  normalizeRecordInput,
  normalizeTime,
  sanitizeText,
} from "../configs/record-schema.js";
import { getReportStatus } from "./report-status.js";

const requiredInputFields = RECORD_SCHEMA.requiredInputFields;

function buildRecord(normalizedInput) {
  return {
    stt: sanitizeText(normalizedInput.stt),
    hoTen_ThuocCtyDonVi: sanitizeText(normalizedInput.hoTen_ThuocCtyDonVi),
    xuongGiao: sanitizeText(normalizedInput.xuongGiao),
    xuongNhan: sanitizeText(normalizedInput.xuongNhan),
    soThe: sanitizeText(normalizedInput.soThe),
    id: sanitizeText(normalizedInput.id),
    loaiPhuongTien_BSX_BKSRomooc: sanitizeText(
      normalizedInput.loaiPhuongTien_BSX_BKSRomooc,
    ),
    soCont_SoSeal: sanitizeText(normalizedInput.soCont_SoSeal),
    chiTietHangHoa: sanitizeText(normalizedInput.chiTietHangHoa),
    soPhieu: sanitizeText(normalizedInput.soPhieu),
    gioVao: normalizeTime(normalizedInput.gioVao),
    gioRa: normalizeTime(normalizedInput.gioRa),
    ghiChu: sanitizeText(normalizedInput.ghiChu),
  };
}

function checkRequiredFields(normalizedInput, requiredFields) {
  for (const field of requiredFields) {
    const value = sanitizeText(normalizedInput[field]);
    if (!value) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Validate a report payload.
 *
 * @param {object|string} payload - The report data (object or JSON string).
 * @param {"draft"|"complete"} mode - "draft" allows empty gioRa (pending);
 *   "complete" requires a valid gioRa (completed).
 * @returns {{ ok: boolean, record?: object, status?: string, error?: string }}
 */
export function validateRecordPayload(payload, mode = "complete") {
  let parsedPayload = payload;

  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      return { ok: false, error: "Invalid JSON payload." };
    }
  }

  if (
    !parsedPayload ||
    typeof parsedPayload !== "object" ||
    Array.isArray(parsedPayload)
  ) {
    return { ok: false, error: "Payload must be an object." };
  }

  const rawGioVao = sanitizeText(parsedPayload.gioVao);
  const rawGioRa = sanitizeText(parsedPayload.gioRa);

  const normalizedInput = normalizeRecordInput(parsedPayload);

  // Sanitize all string fields.
  for (const [fieldName, fieldType] of Object.entries(
    RECORD_SCHEMA.fieldTypes,
  )) {
    if (
      fieldName === "stt" ||
      fieldName === "gioVao" ||
      fieldName === "gioRa"
    ) {
      continue;
    }
    if (fieldType === "string" && typeof normalizedInput[fieldName] !== "undefined") {
      sanitizeText(normalizedInput[fieldName]);
    }
  }

  // stt must be numeric when provided.
  if (RECORD_SCHEMA.validators.stt(normalizedInput.stt) === false) {
    return { ok: false, error: "Field stt must be numeric." };
  }

  // gioVao must be a valid time when provided.
  if (rawGioVao && !normalizeTime(rawGioVao)) {
    return { ok: false, error: "Field gioVao must be a valid time." };
  }

  // gioRa must be a valid time when provided.
  if (rawGioRa && !normalizeTime(rawGioRa)) {
    return {
      ok: false,
      error: "Field gioRa must be a valid time.",
    };
  }

  if (mode === "complete") {
    const normalizedGioRa = normalizeTime(rawGioRa);
    if (!normalizedGioRa) {
      return {
        ok: false,
        error: "Field gioRa is required in complete mode.",
      };
    }
  }

  const missingError = checkRequiredFields(normalizedInput, requiredInputFields);
  if (missingError) {
    return { ok: false, error: missingError };
  }

  const record = buildRecord(normalizedInput);
  const status = getReportStatus(record);

  return { ok: true, record, status };
}

export function validateRequestPayload(rawBody, mode = "complete") {
  if (rawBody === undefined || rawBody === null) {
    return { ok: false, error: "Request body is required." };
  }

  const tempRecord = rawBody?.tempRecord;

  if (typeof tempRecord !== "undefined" && tempRecord !== null) {
    if (typeof tempRecord === "string") {
      try {
        const parsedTempRecord = JSON.parse(tempRecord);
        if (
          !parsedTempRecord ||
          typeof parsedTempRecord !== "object" ||
          Array.isArray(parsedTempRecord)
        ) {
          return { ok: false, error: "tempRecord must be an object." };
        }
      } catch {
        return { ok: false, error: "Invalid JSON in tempRecord." };
      }
    } else if (typeof tempRecord !== "object" || Array.isArray(tempRecord)) {
      return { ok: false, error: "tempRecord must be an object." };
    }
  }

  const requestPayload = tempRecord ?? rawBody;
  return validateRecordPayload(requestPayload, mode);
}

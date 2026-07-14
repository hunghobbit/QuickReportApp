import { RECORD_SCHEMA, normalizeRecordInput, normalizeTime } from "../configs/record-schema.js";

function sanitizeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

export function validateRecordPayload(payload) {
  let parsedPayload = payload;

  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
      return { ok: false, error: "Invalid JSON payload." };
    }
  }

  if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
    return { ok: false, error: "Payload must be an object." };
  }

  const normalizedInput = normalizeRecordInput(parsedPayload);

  for (const field of RECORD_SCHEMA.requiredPayloadFields) {
    const value = sanitizeText(normalizedInput[field]);
    if (!value) {
      return { ok: false, error: `Missing required field: ${field}` };
    }
  }

  for (const [fieldName, fieldType] of Object.entries(RECORD_SCHEMA.fieldTypes)) {
    if (fieldName === "stt" || fieldName === "gioVao" || fieldName === "gioRa") {
      continue;
    }
    if (fieldType === "string" && typeof normalizedInput[fieldName] !== "undefined") {
      sanitizeText(normalizedInput[fieldName]);
    }
  }

  if (RECORD_SCHEMA.validators.stt(normalizedInput.stt) === false) {
    return { ok: false, error: "Field stt must be numeric." };
  }

  const normalizedGioVao = normalizeTime(normalizedInput.gioVao);
  const normalizedGioRa = normalizeTime(normalizedInput.gioRa);
  if (!normalizedGioVao || !normalizedGioRa) {
    return { ok: false, error: "Fields gioVao and gioRa must be valid times." };
  }

  const record = {
    stt: sanitizeText(normalizedInput.stt),
    hoTen_ThuocCtyDonVi: sanitizeText(normalizedInput.hoTen_ThuocCtyDonVi),
    xuongGiao: sanitizeText(normalizedInput.xuongGiao),
    xuongNhan: sanitizeText(normalizedInput.xuongNhan),
    soThe: sanitizeText(normalizedInput.soThe),
    id: sanitizeText(normalizedInput.id),
    loaiPhuongTien_BSX_BKSRomooc: sanitizeText(normalizedInput.loaiPhuongTien_BSX_BKSRomooc),
    soCont_SoSeal: sanitizeText(normalizedInput.soCont_SoSeal),
    chiTietHangHoa: sanitizeText(normalizedInput.chiTietHangHoa),
    soPhieu: sanitizeText(normalizedInput.soPhieu),
    gioVao: normalizedGioVao,
    gioRa: normalizedGioRa,
    ghiChu: sanitizeText(normalizedInput.ghiChu),
  };

  return { ok: true, record };
}

export function validateRequestPayload(rawBody) {
  if (rawBody === undefined || rawBody === null) {
    return { ok: false, error: "Request body is required." };
  }

  const tempRecord = rawBody?.tempRecord;

  if (typeof tempRecord !== "undefined" && tempRecord !== null) {
    if (typeof tempRecord === "string") {
      try {
        const parsedTempRecord = JSON.parse(tempRecord);
        if (!parsedTempRecord || typeof parsedTempRecord !== "object" || Array.isArray(parsedTempRecord)) {
          return { ok: false, error: "tempRecord must be an object." };
        }
      } catch (error) {
        return { ok: false, error: "Invalid JSON in tempRecord." };
      }
    } else if (typeof tempRecord !== "object" || Array.isArray(tempRecord)) {
      return { ok: false, error: "tempRecord must be an object." };
    }
  }

  const requestPayload = tempRecord ?? rawBody;
  return validateRecordPayload(requestPayload);
}

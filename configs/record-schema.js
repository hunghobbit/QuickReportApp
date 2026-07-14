function sanitizeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function joinNonEmptyValues(values = [], joiner = " - ") {
  const joinedValues = values
    .filter((value) => value !== null && value !== undefined)
    .map((value) => sanitizeText(value))
    .filter((value) => value !== "");

  return joinedValues.join(joiner);
}

export function normalizeTime(value) {
  const text = sanitizeText(value);
  if (!text) return "";

  const match = text.match(/^(\d{1,2})(?:[:.](\d{1,2}))(?:[:.](\d{1,2}))?$/);
  if (!match) return text;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export const RECORD_SCHEMA = {
  labels: {
    stt: "Số thứ tự",
    hoTen: "Họ tên/Tài xế/NMH",
    thuocCtyDonVi: "Thuộc Cty/Đơn vị",
    xuongGiao: "Xưởng Xuất",
    xuongNhan: "Xưởng Nhập",
    soThe: "Số thẻ",
    id: "Loại giấy tờ - Số giấy tờ",
    loaiPhuongTien: "Phương tiện",
    bks: "Biển số xe",
    bksRomooc: "BKS Rơ-mooc",
    soCont: "Số Cont",
    soSeal: "Số Seal",
    chiTietHangHoa: "Số lượng - Đơn vị - Tên hàng hóa",
    soPhieu: "Phiếu Giao/Phiếu MHRC",
    gioVao: "Giờ vào",
    gioRa: "Giờ ra",
    ghiChu: "Ghi chú",
    hoTen_ThuocCtyDonVi: "Họ tên - Thuộc Cty/Đơn vị",
    loaiPhuongTien_BSX_BKSRomooc: "Loại phương tiện - BSX/BKS Rơ-mooc",
    soCont_SoSeal: "Số Cont - Số Seal",
  },
  groups: [
    ["stt"],
    ["hoTen", "thuocCtyDonVi"],
    ["xuongGiao", "xuongNhan"],
    ["soThe", "id"],
    ["loaiPhuongTien", "bks", "bksRomooc"],
    ["soCont", "soSeal"],
    ["soPhieu"],
    ["gioVao", "gioRa"],
    ["chiTietHangHoa"],
    ["ghiChu"],
  ],
  excelColumnMap: {
    stt: 1,
    hoTen_ThuocCtyDonVi: 2,
    xuongGiao: 3,
    xuongNhan: 4,
    soThe: 5,
    id: 6,
    loaiPhuongTien_BSX_BKSRomooc: 7,
    soCont_SoSeal: 8,
    chiTietHangHoa: 9,
    soPhieu: 10,
    gioVao: 11,
    gioRa: 12,
    ghiChu: 13,
  },
  // These are the field names accepted by the write-record API.  The form has
  // a few more, smaller fields which are combined into these values below.
  payloadFields: [
    "stt",
    "hoTen_ThuocCtyDonVi",
    "xuongGiao",
    "xuongNhan",
    "soThe",
    "id",
    "loaiPhuongTien_BSX_BKSRomooc",
    "soCont_SoSeal",
    "chiTietHangHoa",
    "soPhieu",
    "gioVao",
    "gioRa",
    "ghiChu",
  ],
  formFields: [
    "stt",
    "hoTen",
    "thuocCtyDonVi",
    "xuongGiao",
    "xuongNhan",
    "soThe",
    "id",
    "loaiPhuongTien",
    "bks",
    "bksRomooc",
    "soCont",
    "soSeal",
    "chiTietHangHoa",
    "soPhieu",
    "gioVao",
    "gioRa",
    "ghiChu",
  ],
  requiredPayloadFields: [
    "stt",
    "hoTen_ThuocCtyDonVi",
    "xuongGiao",
    "xuongNhan",
    "soThe",
    "loaiPhuongTien_BSX_BKSRomooc",
    "chiTietHangHoa",
    "soPhieu",
    "gioVao",
    "gioRa",
  ],
  aliases: {
    id: ["cccd"],
    soCont: ["soCont_SoSeal"],
    soSeal: ["soCont_SoSeal"],
    hoTen: ["hoTen_ThuocCtyDonVi"],
    thuocCtyDonVi: ["hoTen_ThuocCtyDonVi"],
    loaiPhuongTien: ["loaiPhuongTien_BSX_BKSRomooc"],
    bks: ["loaiPhuongTien_BSX_BKSRomooc"],
    bksRomooc: ["loaiPhuongTien_BSX_BKSRomooc"],
  },
  fieldTypes: {
    stt: "number",
    hoTen: "string",
    thuocCtyDonVi: "string",
    xuongGiao: "string",
    xuongNhan: "string",
    soThe: "string",
    id: "string",
    loaiPhuongTien: "string",
    bks: "string",
    bksRomooc: "string",
    soCont: "string",
    soSeal: "string",
    chiTietHangHoa: "string",
    soPhieu: "string",
    gioVao: "time",
    gioRa: "time",
    ghiChu: "string",
  },
  validators: {
    stt: (value) => /^\d+$/.test(sanitizeText(value)),
    gioVao: (value) => Boolean(normalizeTime(value)),
    gioRa: (value) => Boolean(normalizeTime(value)),
  },
};

function resolveFieldValue(values = {}, fieldName, aliases = []) {
  const candidates = [fieldName, ...aliases];
  for (const candidate of candidates) {
    const value = sanitizeText(values[candidate]);
    if (value) return value;
  }

  return "";
}

function resolveCompoundField(values = {}, fieldName, sourceFields = []) {
  const explicitValue = sanitizeText(values[fieldName]);
  if (explicitValue) return explicitValue;

  return joinNonEmptyValues(
    sourceFields.map((field) => values[field]),
    " - ",
  );
}

export function normalizeRecordInput(values = {}) {
  const inputValues =
    values && typeof values === "object" && !Array.isArray(values)
      ? values
      : {};

  const normalized = {
    stt: sanitizeText(resolveFieldValue(inputValues, "stt")),
    hoTen: sanitizeText(
      resolveFieldValue(inputValues, "hoTen", RECORD_SCHEMA.aliases.hoTen),
    ),
    thuocCtyDonVi: sanitizeText(
      resolveFieldValue(
        inputValues,
        "thuocCtyDonVi",
        RECORD_SCHEMA.aliases.thuocCtyDonVi,
      ),
    ),
    xuongGiao: sanitizeText(resolveFieldValue(inputValues, "xuongGiao")),
    xuongNhan: sanitizeText(resolveFieldValue(inputValues, "xuongNhan")),
    soThe: sanitizeText(resolveFieldValue(inputValues, "soThe")),
    id: sanitizeText(
      resolveFieldValue(inputValues, "id", RECORD_SCHEMA.aliases.id),
    ),
    loaiPhuongTien: sanitizeText(
      resolveFieldValue(
        inputValues,
        "loaiPhuongTien",
        RECORD_SCHEMA.aliases.loaiPhuongTien,
      ),
    ),
    bks: sanitizeText(
      resolveFieldValue(inputValues, "bks", RECORD_SCHEMA.aliases.bks),
    ),
    bksRomooc: sanitizeText(
      resolveFieldValue(
        inputValues,
        "bksRomooc",
        RECORD_SCHEMA.aliases.bksRomooc,
      ),
    ),
    soCont: sanitizeText(
      resolveFieldValue(inputValues, "soCont", RECORD_SCHEMA.aliases.soCont),
    ),
    soSeal: sanitizeText(
      resolveFieldValue(inputValues, "soSeal", RECORD_SCHEMA.aliases.soSeal),
    ),
    chiTietHangHoa: sanitizeText(
      resolveFieldValue(inputValues, "chiTietHangHoa"),
    ),
    soPhieu: sanitizeText(resolveFieldValue(inputValues, "soPhieu")),
    gioVao: normalizeTime(resolveFieldValue(inputValues, "gioVao")),
    gioRa: normalizeTime(resolveFieldValue(inputValues, "gioRa")),
    ghiChu: sanitizeText(resolveFieldValue(inputValues, "ghiChu")),
  };

  normalized.hoTen_ThuocCtyDonVi = resolveCompoundField(
    inputValues,
    "hoTen_ThuocCtyDonVi",
    ["hoTen", "thuocCtyDonVi"],
  );
  normalized.loaiPhuongTien_BSX_BKSRomooc = resolveCompoundField(
    inputValues,
    "loaiPhuongTien_BSX_BKSRomooc",
    ["loaiPhuongTien", "bks", "bksRomooc"],
  );
  normalized.soCont_SoSeal = resolveCompoundField(
    inputValues,
    "soCont_SoSeal",
    ["soCont", "soSeal"],
  );

  return normalized;
}

export function createInitialRecordForm() {
  return Object.fromEntries(
    RECORD_SCHEMA.formFields.map((fieldName) => [fieldName, ""]),
  );
}

// Convert the editable form state into the API contract.  Do not send UI-only
// split fields such as `hoTen` or `bks`; the API receives their combined
// counterparts in the same order as the Excel columns.
export function buildRecordPayload(values = {}) {
  const normalized = normalizeRecordInput(values);

  return Object.fromEntries(
    RECORD_SCHEMA.payloadFields.map((fieldName) => [
      fieldName,
      normalized[fieldName],
    ]),
  );
}

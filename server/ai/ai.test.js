// server/ai/ai.test.js
// Tests for the AI report generator modules:
//   buildInput.js, report-parser.js, validator.js
import { describe, it, expect } from "vitest";
import {
  buildReportTemplate,
  buildInput,
  buildPromptMessages,
} from "./buildInput.js";
import {
  parseReportFromAI,
  mapAIFieldsToRecord,
} from "./report-parser.js";
import { validateReportFields, ALL_FIELDS } from "./validator.js";

// ─── buildReportTemplate ──────────────────────────────────────────

describe("buildReportTemplate", () => {
  it("returns a non-empty string", () => {
    const template = buildReportTemplate();
    expect(typeof template).toBe("string");
    expect(template.length).toBeGreaterThan(0);
  });

  it("starts with the header line", () => {
    const template = buildReportTemplate();
    expect(template.startsWith("🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng")).toBe(true);
  });

  it("ends with the footer line", () => {
    const template = buildReportTemplate();
    expect(template.endsWith("Báo cáo hết!")).toBe(true);
  });

  it("contains all xuat-nhap bullet-point fields", () => {
    const template = buildReportTemplate();
    const expectedLabels = [
      "Ngày",
      "Họ Tên",
      "Cty",
      "Xưởng giao",
      "Xưởng nhận",
      "Phương tiện",
      "BSX",
      "Người liên hệ",
      "Mục đích ra/vào xưởng",
      "Số phiếu MHRC/Số lượng/Chủng loại",
      "Seal/Niêm phong",
      "Số cont",
      "Thời gian vào",
      "Thời gian ra",
    ];
    for (const label of expectedLabels) {
      expect(template).toContain(`• ${label}`);
    }
  });
});

// ─── buildInput ───────────────────────────────────────────────────

describe("buildInput", () => {
  it("returns a plain-text prompt with required sections", () => {
    const input = buildInput({
      userInput: {
        companyName: "ABC Corp",
        transportCompany: "XYZ Transport",
        goodsDetails: "01 xe hàng",
        reason: "Nhập hàng vào ELA - cổng 1",
      },
      ocr: { idCard: "CCCD 123", licensePlate: "51F-12345", seal: "998877" },
    });

    expect(input).toContain("DỮ LIỆU NGƯỜI DÙNG");
    expect(input).toContain("Công ty:\nABC Corp");
    expect(input).toContain("Đơn vị vận chuyển:\nXYZ Transport");
    expect(input).toContain("Lý do / Mục đích:\nNhập hàng vào ELA - cổng 1");
    expect(input).toContain("Hàng hóa bổ sung:\n01 xe hàng");
    expect(input).toContain("MẪU BÁO CÁO");
    expect(input).toContain("YÊU CẦU");
    expect(input).not.toContain('"userInput"');
    expect(input).not.toContain('"reportTemplate"');
  });

  it("includes OCR values in the plain-text prompt", () => {
    const input = buildInput({
      userInput: {},
      ocr: { idCard: "CCCD 123", licensePlate: "51F-12345", seal: "998877" },
    });

    expect(input).toContain("CCCD 123");
    expect(input).toContain("51F-12345");
    expect(input).toContain("998877");
  });

  it("defaults missing values to empty strings in plain text", () => {
    const input = buildInput();
    expect(input).toContain("Công ty:\n");
    expect(input).toContain("Đơn vị vận chuyển:\n");
  });
});

// ─── buildPromptMessages ──────────────────────────────────────────

describe("buildPromptMessages", () => {
  it("returns object with system and user keys", () => {
    const messages = buildPromptMessages({ userInput: {}, ocr: {} });
    expect(messages).toHaveProperty("system");
    expect(messages).toHaveProperty("user");
    expect(typeof messages.system).toBe("string");
    expect(typeof messages.user).toBe("string");
  });

  it("system prompt contains the report title", () => {
    const messages = buildPromptMessages({ userInput: {}, ocr: {} });
    expect(messages.system).toContain("Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng");
  });

  it("system prompt forbids placeholder xưởng values", () => {
    const messages = buildPromptMessages({ userInput: {}, ocr: {} });
    expect(messages.system).toContain("Tuyệt đối không xuất các chuỗi placeholder chung chung");
  });

  it("user prompt uses plain text format", () => {
    const messages = buildPromptMessages({
      userInput: { companyName: "ABC Corp", transportCompany: "XYZ Transport" },
      ocr: { licensePlate: "51F-12345" },
    });

    expect(messages.user).toContain("DỮ LIỆU NGƯỜI DÙNG");
    expect(messages.user).toContain("MẪU BÁO CÁO");
    expect(messages.user).toContain("51F-12345");
  });
});

// ─── parseReportFromAI ────────────────────────────────────────────

describe("parseReportFromAI", () => {
  it("returns empty fields for null/undefined input", () => {
    const fields = parseReportFromAI(null);
    expect(fields.ngay).toBe("");
    expect(fields.hoTen).toBe("");
    expect(fields.bienSo).toBe("");
  });

  it("parses a well-formed report", () => {
    const report = [
      "🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng",
      "• Ngày : 15/01/2024",
      "• Họ Tên : Nguyễn Văn A",
      "• Cty : Công ty ABC",
      "• Xưởng giao : Xiang Yuang",
      "• Xưởng nhận : ELA - cổng 1",
      "• Phương tiện : Xe tải",
      "• BSX : 51F-12345",
      "• Người liên hệ : Trần B",
      "• Mục đích ra/vào xưởng : Giao hàng",
      "• Số phiếu MHRC/Số lượng/Chủng loại: MHRC001 / 100 thùng / Nước ngọt",
      "• Seal/Niêm phong: 998877",
      "• Số cont: TCLU1234567",
      "• Thời gian vào : 08:00",
      "• Thời gian ra : 10:30",
      "Báo cáo hết!",
    ].join("\n");

    const fields = parseReportFromAI(report);
    expect(fields.ngay).toBe("15/01/2024");
    expect(fields.hoTen).toBe("Nguyễn Văn A");
    expect(fields.congTy).toBe("Công ty ABC");
    expect(fields.xuongGiao).toBe("Xiang Yuang");
    expect(fields.xuongNhan).toBe("ELA - cổng 1");
    expect(fields.phuongTien).toBe("Xe tải");
    expect(fields.bienSo).toBe("51F-12345");
    expect(fields.nguoiLienHe).toBe("Trần B");
    expect(fields.mucDich).toBe("Giao hàng");
    expect(fields.soPhieuHangHoa).toBe("MHRC001 / 100 thùng / Nước ngọt");
    expect(fields.seal).toBe("998877");
    expect(fields.soCont).toBe("TCLU1234567");
    expect(fields.gioVao).toBe("08:00");
    expect(fields.gioRa).toBe("10:30");
  });

  it("handles labels without space before colon", () => {
    const report = [
      "🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng",
      "• Họ Tên: Lê Văn C",
      "• BSX: 59C-123.45",
      "Báo cáo hết!",
    ].join("\n");

    const fields = parseReportFromAI(report);
    expect(fields.hoTen).toBe("Lê Văn C");
    expect(fields.bienSo).toBe("59C-123.45");
  });

  it("handles lines without bullet point", () => {
    const report = [
      "🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng",
      "Ngày : 20/01/2024",
      "Họ Tên : Phạm D",
      "Báo cáo hết!",
    ].join("\n");

    const fields = parseReportFromAI(report);
    expect(fields.ngay).toBe("20/01/2024");
    expect(fields.hoTen).toBe("Phạm D");
  });

  it("leaves missing fields as empty strings", () => {
    const report = [
      "🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng",
      "• Họ Tên : Nguyễn A",
      "• BSX : 51F-12345",
      "Báo cáo hết!",
    ].join("\n");

    const fields = parseReportFromAI(report);
    expect(fields.hoTen).toBe("Nguyễn A");
    expect(fields.bienSo).toBe("51F-12345");
    expect(fields.congTy).toBe("");
    expect(fields.seal).toBe("");
    expect(fields.gioVao).toBe("");
  });

  it("matches labels case-insensitively", () => {
    const report = [
      "🚖 Báo Cáo Giám Sát Người/Xe Ra Vào Xưởng",
      "• họ tên : Test Case",
      "• bsx : 51F-99999",
      "Báo cáo hết!",
    ].join("\n");

    const fields = parseReportFromAI(report);
    expect(fields.hoTen).toBe("Test Case");
    expect(fields.bienSo).toBe("51F-99999");
  });
});

// ─── mapAIFieldsToRecord ──────────────────────────────────────────

describe("mapAIFieldsToRecord", () => {
  it("maps basic fields correctly", () => {
    const aiFields = {
      ngay: "15/01/2024",
      hoTen: "Nguyễn Văn A",
      congTy: "Công ty ABC",
      xuongGiao: "Xiang Yuang",
      xuongNhan: "ELA - cổng 1",
      phuongTien: "Xe tải",
      bienSo: "51F-12345",
      nguoiLienHe: "Trần B",
      mucDich: "Giao hàng",
      soPhieuHangHoa: "MHRC001 / 100 thùng / Nước ngọt",
      seal: "998877",
      soCont: "TCLU1234567",
      gioVao: "08:00",
      gioRa: "10:30",
    };

    const record = mapAIFieldsToRecord(aiFields);
    expect(record.hoTen).toBe("Nguyễn Văn A");
    expect(record.thuocCtyDonVi).toBe("Công ty ABC");
    expect(record.xuongGiao).toBe("Xiang Yuang");
    expect(record.xuongNhan).toBe("ELA - cổng 1");
    expect(record.loaiPhuongTien).toBe("Xe tải");
    expect(record.bks).toBe("51F-12345");
    expect(record.soSeal).toBe("998877");
    expect(record.soCont).toBe("TCLU1234567");
    expect(record.gioVao).toBe("08:00");
    expect(record.gioRa).toBe("10:30");
    expect(record.ngay).toBe("15/01/2024");
  });

  it("maps soCont from aiFields", () => {
    const aiFields = {
      soCont: "TCLU1234567",
    };

    const record = mapAIFieldsToRecord(aiFields);
    expect(record.soCont).toBe("TCLU1234567");
  });

  it("maps CCCD from originalInput.ocr.idCard to id field", () => {
    const aiFields = { hoTen: "Nguyễn Văn A" };
    const originalInput = { ocr: { idCard: "079201012345" } };

    const record = mapAIFieldsToRecord(aiFields, originalInput);
    expect(record.id).toBe("079201012345");
  });

  it("maps CCCD from originalInput.userInput.cccd to id field", () => {
    const aiFields = { hoTen: "Nguyễn Văn A" };
    const originalInput = { userInput: { cccd: "079201012345" } };

    const record = mapAIFieldsToRecord(aiFields, originalInput);
    expect(record.id).toBe("079201012345");
  });

  it("builds ghiChu from nguoiLienHe and mucDich", () => {
    const aiFields = {
      nguoiLienHe: "Trần B",
      mucDich: "Giao hàng",
    };

    const record = mapAIFieldsToRecord(aiFields);
    expect(record.ghiChu).toContain("Người liên hệ: Trần B");
    expect(record.ghiChu).toContain("Mục đích: Giao hàng");
    expect(record.ghiChu).toContain(" | ");
  });

  it("splits soPhieuHangHoa at first slash", () => {
    const aiFields = {
      soPhieuHangHoa: "MHRC001 / 100 thùng / Nước ngọt",
    };

    const record = mapAIFieldsToRecord(aiFields);
    expect(record.soPhieu).toBe("MHRC001");
    expect(record.chiTietHangHoa).toBe("100 thùng / Nước ngọt");
  });

  it("keeps full value in chiTietHangHoa when no slash", () => {
    const aiFields = {
      soPhieuHangHoa: "MHRC001",
    };

    const record = mapAIFieldsToRecord(aiFields);
    expect(record.soPhieu).toBe("MHRC001");
    expect(record.chiTietHangHoa).toBe("MHRC001");
  });

  it("handles empty input gracefully", () => {
    const record = mapAIFieldsToRecord({});
    expect(record.hoTen).toBe("");
    expect(record.bks).toBe("");
    expect(record.ghiChu).toBe("");
  });
});

// ─── validateReportFields ─────────────────────────────────────────

describe("validateReportFields", () => {
  it("returns found/missing/warnings structure", () => {
    const result = validateReportFields({});
    expect(result).toHaveProperty("fields");
    expect(result).toHaveProperty("found");
    expect(result).toHaveProperty("missing");
    expect(result).toHaveProperty("warnings");
    expect(Array.isArray(result.found)).toBe(true);
    expect(Array.isArray(result.missing)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it("all fields missing when input is empty", () => {
    const result = validateReportFields({});
    expect(result.found).toHaveLength(0);
    expect(result.missing.length).toBe(ALL_FIELDS.length);
  });

  it("marks fields as found when they have values", () => {
    const result = validateReportFields({
      ngay: "15/01/2024",
      hoTen: "Nguyễn A",
      xuongGiao: "Xiang Yuang",
      bienSo: "51F-12345",
    });
    expect(result.found).toContain("Ngày");
    expect(result.found).toContain("Họ Tên");
    expect(result.found).toContain("Xưởng giao");
    expect(result.found).toContain("BSX");
    expect(result.missing).not.toContain("Ngày");
    expect(result.missing).not.toContain("Họ Tên");
    expect(result.missing).not.toContain("BSX");
  });

  it("normalizes gioVao", () => {
    const result = validateReportFields({ gioVao: "8:5" });
    expect(result.fields.gioVao).toBe("08:05");
  });

  it("normalizes gioRa", () => {
    const result = validateReportFields({ gioRa: "14.30" });
    expect(result.fields.gioRa).toBe("14:30");
  });

  it("warns on invalid gioVao", () => {
    const result = validateReportFields({ gioVao: "25:00" });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("Giờ vào"))).toBe(true);
  });

  it("normalizes DD/MM/YYYY date format", () => {
    const result = validateReportFields({ ngay: "5/1/2024" });
    expect(result.fields.ngay).toBe("05/01/2024");
  });

  it("converts YYYY-MM-DD to DD/MM/YYYY", () => {
    const result = validateReportFields({ ngay: "2024-01-15" });
    expect(result.fields.ngay).toBe("15/01/2024");
  });

  it("warns on invalid date format", () => {
    const result = validateReportFields({ ngay: "not-a-date" });
    expect(result.warnings.some((w) => w.includes("Ngày"))).toBe(true);
  });

  it("warns on invalid license plate format", () => {
    const result = validateReportFields({ bienSo: "invalid-plate" });
    expect(result.warnings.some((w) => w.includes("Biển số"))).toBe(true);
  });

  it("does not warn on valid license plate", () => {
    const result = validateReportFields({ bienSo: "51F-12345" });
    expect(result.warnings.some((w) => w.includes("Biển số"))).toBe(false);
  });

  it("warns on invalid seal format", () => {
    const result = validateReportFields({ seal: "abc" });
    expect(result.warnings.some((w) => w.includes("seal"))).toBe(true);
  });

  it("does not warn on valid seal format", () => {
    const result = validateReportFields({ seal: "998877" });
    expect(result.warnings.some((w) => w.includes("seal"))).toBe(false);
  });

  it("warns on invalid container format", () => {
    const result = validateReportFields({ soCont: "TCLU12345" });
    expect(result.warnings.some((w) => w.includes("Sơ cont"))).toBe(true);
  });

  it("does not warn on valid container format", () => {
    const result = validateReportFields({ soCont: "TCLU1234567" });
    expect(result.warnings.some((w) => w.includes("Sơ cont"))).toBe(false);
  });

  it("has soCont field in ALL_FIELDS", () => {
    expect(ALL_FIELDS.some((f) => f.key === "soCont")).toBe(true);
  });
});
// services/report-status.test.js
import { describe, it, expect } from "vitest";
import { normalizeTime } from "../configs/record-schema.js";
import {
  REPORT_STATUS,
  getReportStatus,
  isReportCompleted,
  isReportPending,
} from "./report-status.js";
import { validateRecordPayload } from "./record-validation.js";

// ─── normalizeTime ───────────────────────────────────────────────

describe("normalizeTime", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(normalizeTime(null)).toBe("");
    expect(normalizeTime(undefined)).toBe("");
    expect(normalizeTime("")).toBe("");
    expect(normalizeTime("   ")).toBe("");
  });

  it("normalizes HH:MM with zero-padding", () => {
    expect(normalizeTime("7:05")).toBe("07:05");
    expect(normalizeTime("07:05")).toBe("07:05");
    expect(normalizeTime("12:30")).toBe("12:30");
    expect(normalizeTime("23:59")).toBe("23:59");
    expect(normalizeTime("0:0")).toBe("00:00");
  });

  it("accepts dot separator", () => {
    expect(normalizeTime("7.05")).toBe("07:05");
    expect(normalizeTime("12.30")).toBe("12:30");
  });

  it("accepts seconds but drops them", () => {
    expect(normalizeTime("7:05:30")).toBe("07:05");
    expect(normalizeTime("12.30.45")).toBe("12:30");
  });

  it("returns empty string for out-of-range hour", () => {
    expect(normalizeTime("24:00")).toBe("");
    expect(normalizeTime("25:00")).toBe("");
  });

  it("returns empty string for out-of-range minute", () => {
    expect(normalizeTime("12:60")).toBe("");
    expect(normalizeTime("12:99")).toBe("");
  });

  it("returns original text for non-matching input", () => {
    expect(normalizeTime("abc")).toBe("abc");
    expect(normalizeTime("noon")).toBe("noon");
  });

  it("trims whitespace before normalizing", () => {
    expect(normalizeTime("  7:05  ")).toBe("07:05");
  });
});

// ─── getReportStatus ─────────────────────────────────────────────

describe("getReportStatus", () => {
  it("returns pending when gioRa is empty", () => {
    expect(getReportStatus({ gioRa: "" })).toBe(REPORT_STATUS.PENDING);
  });

  it("returns pending when gioRa is undefined", () => {
    expect(getReportStatus({})).toBe(REPORT_STATUS.PENDING);
    expect(getReportStatus({ gioRa: undefined })).toBe(REPORT_STATUS.PENDING);
  });

  it("returns pending when gioRa is null", () => {
    expect(getReportStatus({ gioRa: null })).toBe(REPORT_STATUS.PENDING);
  });

  it("returns pending when gioRa is invalid", () => {
    expect(getReportStatus({ gioRa: "25:00" })).toBe(REPORT_STATUS.PENDING);
    expect(getReportStatus({ gioRa: "abc" })).toBe(REPORT_STATUS.PENDING);
  });

  it("returns completed when gioRa is a valid time", () => {
    expect(getReportStatus({ gioRa: "07:05" })).toBe(REPORT_STATUS.COMPLETED);
    expect(getReportStatus({ gioRa: "12:30" })).toBe(REPORT_STATUS.COMPLETED);
    expect(getReportStatus({ gioRa: "7:05" })).toBe(REPORT_STATUS.COMPLETED);
  });

  it("returns completed when gioRa is a valid time with dot separator", () => {
    expect(getReportStatus({ gioRa: "7.05" })).toBe(REPORT_STATUS.COMPLETED);
  });
});

describe("isReportCompleted / isReportPending", () => {
  it("isReportCompleted returns true only for completed", () => {
    expect(isReportCompleted({ gioRa: "07:05" })).toBe(true);
    expect(isReportCompleted({ gioRa: "" })).toBe(false);
  });

  it("isReportPending returns true only for pending", () => {
    expect(isReportPending({ gioRa: "" })).toBe(true);
    expect(isReportPending({ gioRa: "07:05" })).toBe(false);
  });
});

// ─── validateRecordPayload (two-mode validation) ──────────────────

const validBase = {
  hoTen: "Nguyễn Văn A",
  thuocCtyDonVi: "Công ty ABC",
  id: "CCCD 123456789",
  loaiPhuongTien: "Xe tải",
  xuongGiao: "Xưởng Giao",
  gioRa: "08:30",
};

describe("validateRecordPayload — draft mode", () => {
  it("accepts a record with empty gioRa (pending)", () => {
    const result = validateRecordPayload(
      { ...validBase, gioRa: "" },
      "draft",
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe(REPORT_STATUS.PENDING);
    expect(result.record.gioRa).toBe("");
  });

  it("accepts a record with valid gioRa (still draft mode, status computed)", () => {
    const result = validateRecordPayload(validBase, "draft");
    expect(result.ok).toBe(true);
    expect(result.status).toBe(REPORT_STATUS.COMPLETED);
  });

  it("rejects missing required field (hoTen)", () => {
    const result = validateRecordPayload(
      { ...validBase, hoTen: "" },
      "draft",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("hoTen");
  });

  it("accepts missing gioVao because it is optional", () => {
    const result = validateRecordPayload(
      { ...validBase, gioVao: "" },
      "draft",
    );
    expect(result.ok).toBe(true);
  });

  it("rejects non-numeric stt when it is provided", () => {
    const result = validateRecordPayload(
      { ...validBase, stt: "abc" },
      "draft",
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("stt");
  });
});

describe("validateRecordPayload — complete mode (default)", () => {
  it("accepts a record with valid gioRa (completed)", () => {
    const result = validateRecordPayload(validBase);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(REPORT_STATUS.COMPLETED);
    expect(result.record.gioRa).toBe("08:30");
  });

  it("rejects a record with empty gioRa in complete mode", () => {
    const result = validateRecordPayload({ ...validBase, gioRa: "" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("gioRa");
  });

  it("rejects a record with invalid gioRa", () => {
    const result = validateRecordPayload({ ...validBase, gioRa: "25:00" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("gioRa");
  });

  it("rejects missing required field (id)", () => {
    const result = validateRecordPayload({ ...validBase, id: "" });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("id");
  });
});

describe("validateRecordPayload — JSON string input", () => {
  it("accepts JSON string in draft mode", () => {
    const result = validateRecordPayload(
      JSON.stringify({ ...validBase, gioRa: "" }),
      "draft",
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe(REPORT_STATUS.PENDING);
  });

  it("rejects invalid JSON", () => {
    const result = validateRecordPayload("not json");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid JSON payload.");
  });
});

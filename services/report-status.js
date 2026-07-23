// services/report-status.js
import { normalizeTime } from "../configs/record-schema.js";

export const REPORT_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
};

// gioRa trống hoặc không hợp lệ → pending
// gioRa hợp lệ → completed
export function getReportStatus(record) {
  const gioRa = normalizeTime(record?.gioRa);
  // normalizeTime returns "HH:MM" for valid times, "" for empty/out-of-range,
  // or the original text for non-matching input. Only the "HH:MM" format
  // indicates a valid time.
  const isValidTime = /^\d{2}:\d{2}$/.test(gioRa);
  return isValidTime ? REPORT_STATUS.COMPLETED : REPORT_STATUS.PENDING;
}

export function isReportCompleted(record) {
  return getReportStatus(record) === REPORT_STATUS.COMPLETED;
}

export function isReportPending(record) {
  return getReportStatus(record) === REPORT_STATUS.PENDING;
}

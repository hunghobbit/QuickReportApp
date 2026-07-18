// services/excel-export.js
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import { RECORD_SCHEMA } from "../configs/record-schema.js";
import { START_ROW, ROW_LIMIT, COL_LIMIT } from "../configs/worksheet-config.js";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

// Chỉnh 2 đường dẫn này nếu vị trí thực tế khác.
const TEMPLATE_DIR = path.join(__dirName, "..", "templates");
const WORKING_DIR = path.join(__dirName, "..", "storage", "reports");

// Mutex đơn giản theo key (tên template) — đảm bảo các lần ghi vào
// cùng 1 file luôn chạy tuần tự, tránh race condition khi 2 request
// tới gần như cùng lúc.
const locks = new Map();
function withLock(key, fn) {
  const previous = locks.get(key) || Promise.resolve();
  const run = previous.then(fn, fn);
  locks.set(key, run.catch(() => {}));
  return run;
}

function todayString() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function getWorkingFilePath(templateName) {
  return path.join(WORKING_DIR, `${templateName}_${todayString()}.xlsx`);
}

async function ensureWorkingFile(templateName) {
  const workingPath = getWorkingFilePath(templateName);

  try {
    await fs.access(workingPath);
    return workingPath; // file của hôm nay đã tồn tại, dùng lại
  } catch {
    // Chưa có file cho hôm nay -> tạo mới từ template sạch.
    await fs.mkdir(WORKING_DIR, { recursive: true });
    const templatePath = path.join(TEMPLATE_DIR, `${templateName}_Template.xlsx`);
    await fs.copyFile(templatePath, workingPath);
    return workingPath;
  }
}

function isEmptyRow(ws, rowIndex, maxCol) {
  const row = ws.getRow(rowIndex);
  const valuesToCheck = row.values.slice(1, 1 + maxCol);
  return valuesToCheck.every((val) => !val || val.toString().trim() === "");
}

function findEmptyPairRow(ws, startRow = START_ROW, rowLimit = ROW_LIMIT, colLimit = COL_LIMIT) {
  const maxCol = Math.max(0, Math.trunc(colLimit));
  const effectiveStartRow = Math.max(1, Number(startRow) || 1);
  const maxRow = Math.min(Math.max(effectiveStartRow, rowLimit ?? ROW_LIMIT), ROW_LIMIT);
  const candidateCount = Math.max(0, Math.floor((maxRow - effectiveStartRow) / 2) + 1);
  if (candidateCount <= 0) return null;

  let left = 0;
  let right = candidateCount - 1;
  let bestMatch = null;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const rowIndex = effectiveStartRow + mid * 2;
    if (isEmptyRow(ws, rowIndex, maxCol)) {
      bestMatch = rowIndex;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return bestMatch;
}

function addBorder(worksheet, rowNumber, columns) {
  const row = worksheet.getRow(rowNumber);
  columns.forEach((col) => {
    row.getCell(col).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

export async function buildWorkbookFromRecord(record, templateName = "Goods") {
  return withLock(templateName, async () => {
    const workingPath = await ensureWorkingFile(templateName);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workingPath);
    const worksheet = workbook.getWorksheet(1);

    const rowIndex = findEmptyPairRow(worksheet);
    if (!rowIndex) {
      throw new Error(
        "Hết dòng trống trong file hôm nay. Cần tăng ROW_LIMIT hoặc xử lý sang file phụ.",
      );
    }

    Object.entries(RECORD_SCHEMA.excelColumnMap).forEach(([field, column]) => {
      if (record[field] !== undefined) {
        worksheet.getCell(rowIndex, column).value = record[field];
      }
    });

    addBorder(worksheet, rowIndex, Object.values(RECORD_SCHEMA.excelColumnMap));

    // Ghi đè lại CHÍNH file này — đây là điểm mấu chốt tạo ra hành vi "nối thêm"
    // thay vì "tạo file mới mỗi lần".
    await workbook.xlsx.writeFile(workingPath);

    return { workbook, workingPath };
  });
}
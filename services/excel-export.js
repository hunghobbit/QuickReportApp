// services/excel-export.js
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import { RECORD_SCHEMA } from "../configs/record-schema.js";
import { START_ROW, ROW_LIMIT, COL_LIMIT } from "../configs/worksheet-config.js";
import * as reportRepo from "../database/sqlite-report-repository.js";
import * as exportRunRepo from "../database/export-run-repository.js";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

const TEMPLATE_DIR = process.env.TEMPLATE_DIR 
  ? path.resolve(process.env.TEMPLATE_DIR) 
  : path.join(__dirName, "..", "templates");
const EXPORT_DIR = process.env.EXPORT_DIR 
  ? path.resolve(process.env.EXPORT_DIR) 
  : path.join(__dirName, "..", "storage", "reports");

// Map field names from record object to excelColumnMap keys.
// The excelColumnMap uses `id` for "Loại giấy tờ - Số giấy tờ" (column 6),
// but the record object stores this value in `businessId`.
const FIELD_MAP = {
  id: "businessId",
};

/**
 * Tạo tên file xuất theo format: Báo cáo ddMMyyyyHHmmss.xlsx
 * Thêm milliseconds để tránh trùng tên file khi xuất nhiều lần trong cùng giây
 */
function buildExportFileName() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const timestamp =
    pad(now.getDate()) +
    pad(now.getMonth() + 1) +
    now.getFullYear() +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds()) +
    String(now.getMilliseconds()).padStart(3, "0");
  return `Báo cáo ${timestamp}.xlsx`;
}

/**
 * Kiểm tra một dòng có trống hoàn toàn không (từ cột 1 đến maxCol).
 */
function isEmptyRow(ws, rowIndex, maxCol) {
  const row = ws.getRow(rowIndex);
  const valuesToCheck = row.values.slice(1, 1 + maxCol);
  return valuesToCheck.every((val) => !val || val.toString().trim() === "");
}

/**
 * Tìm dòng trống đầu tiên (tìm kiếm tuần tự từ startRow).
 * Trả về null nếu không tìm thấy.
 */
function findFirstEmptyRow(ws, startRow = START_ROW, maxRow = ROW_LIMIT, colLimit = COL_LIMIT) {
  const maxCol = Math.max(0, Math.trunc(colLimit));
  const effectiveStartRow = Math.max(1, Number(startRow) || 1);
  const effectiveMaxRow = Math.min(Math.max(effectiveStartRow, maxRow ?? ROW_LIMIT), ROW_LIMIT);

  for (let r = effectiveStartRow; r <= effectiveMaxRow; r++) {
    if (isEmptyRow(ws, r, maxCol)) {
      return r;
    }
  }
  return null;
}

/**
 * Thêm border cho một dòng.
 */
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

/**
 * Ghi một bản ghi vào worksheet tại rowIndex.
 * Dùng excelColumnMap để map field → cột.
 * Tự động map field name khác nhau giữa record object và excelColumnMap.
 */
function writeRecordToRow(worksheet, record, rowIndex) {
  Object.entries(RECORD_SCHEMA.excelColumnMap).forEach(([field, column]) => {
    // Map field name nếu cần (vd: excelColumnMap dùng "id" nhưng record dùng "businessId")
    const recordField = FIELD_MAP[field] || field;
    let value = record[recordField];
    if (value === undefined || value === null) {
      value = "";
    }
    worksheet.getCell(rowIndex, column).value = value;
  });

  addBorder(worksheet, rowIndex, Object.values(RECORD_SCHEMA.excelColumnMap));
}

/**
 * Copy cấu trúc (header, style, column widths) từ worksheet gốc sang worksheet mới.
 * Dùng để tạo sheet thứ hai với cùng format.
 */
async function copySheetStructure(sourceWorkbook, sourceWorksheet, targetWorkbook, sheetName) {
  const targetWorksheet = targetWorkbook.addWorksheet(sheetName);

  // Copy column widths
  sourceWorksheet.columns.forEach((col, index) => {
    const targetCol = targetWorksheet.getColumn(index + 1);
    targetCol.width = col.width || 10;
  });

  // Copy header rows (row 1 and 2 from template)
  const headerRowCount = START_ROW - 1; // Usually rows 1-2
  for (let r = 1; r <= headerRowCount; r++) {
    const sourceRow = sourceWorksheet.getRow(r);
    const targetRow = targetWorksheet.getRow(r);
    sourceRow.eachCell((cell, colNumber) => {
      const targetCell = targetRow.getCell(colNumber);
      targetCell.value = cell.value;
      targetCell.font = { ...cell.font };
      targetCell.alignment = { ...cell.alignment };
      targetCell.fill = { ...cell.fill };
      targetCell.border = { ...cell.border };
    });
    targetRow.commit();
  }

  return targetWorksheet;
}

/**
 * Tạo file Excel chứa toàn bộ báo cáo của một ngày từ database.
 * Xuất ra 2 sheet: "Chưa ra xưởng" (pending) và "Đã ra xưởng" (completed).
 *
 * @param {string} reportDate - Ngày báo cáo (YYYY-MM-DD)
 * @param {string} exportType - 'manual' | 'automatic' (mặc định 'manual')
 * @returns {Promise<{ filePath: string, fileName: string }>}
 * @throws {Error} Nếu không có dữ liệu, template không tồn tại, hoặc đã xuất trùng
 */
export async function exportDayReport(reportDate, exportType = "manual") {
  // 1. Kiểm tra chống xuất trùng (chỉ áp dụng cho automatic)
  if (exportType === "automatic") {
    const hasExported = await exportRunRepo.hasSuccessfulExport(reportDate, "automatic");
    if (hasExported) {
      throw new Error(
        `Đã có lượt xuất tự động thành công cho ngày ${reportDate}. Không thể xuất trùng.`
      );
    }
  }

  // 2. Lấy danh sách báo cáo trong ngày
  const reports = await reportRepo.getReportsByDate(reportDate);
  if (!reports || reports.length === 0) {
    throw new Error(`Không có báo cáo nào cho ngày ${reportDate}.`);
  }

  // 2. Đảm bảo thư mục xuất tồn tại
  await fs.mkdir(EXPORT_DIR, { recursive: true });

  // 3. Kiểm tra template tồn tại
  const templatePath = path.join(TEMPLATE_DIR, "Goods_Template.xlsx");
  try {
    await fs.access(templatePath);
  } catch {
    throw new Error(`Template file not found: ${templatePath}`);
  }

  // 4. Mở template
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  const templateWorksheet = workbook.getWorksheet(1);

  if (!templateWorksheet) {
    throw new Error("Template does not contain a worksheet.");
  }

  // 5. Phân loại báo cáo theo status
  const pendingReports = reports.filter((r) => r.status === "pending");
  const completedReports = reports.filter((r) => r.status === "completed");

  // 6. Ghi dữ liệu vào sheet đầu tiên (template gốc) - ưu tiên pending
  const firstSheetData = pendingReports.length > 0 ? pendingReports : completedReports;
  const firstSheetName = pendingReports.length > 0 ? "Chưa ra xưởng" : "Đã ra xưởng";
  templateWorksheet.name = firstSheetName;

  let currentRow = findFirstEmptyRow(templateWorksheet);
  if (!currentRow) {
    throw new Error(
      `Template đã đầy dữ liệu (hết dòng trống từ row ${START_ROW} đến ${ROW_LIMIT}).`,
    );
  }

  for (const record of firstSheetData) {
    if (currentRow > ROW_LIMIT) {
      throw new Error(
        `Số lượng báo cáo (${firstSheetData.length}) vượt quá số dòng trống trong template (${ROW_LIMIT - START_ROW + 1}).`,
      );
    }
    writeRecordToRow(templateWorksheet, record, currentRow);
    currentRow++;
  }

  // 7. Tạo sheet thứ hai nếu có cả hai loại
  if (pendingReports.length > 0 && completedReports.length > 0) {
    const secondSheetName = "Đã ra xưởng";
    const secondWorksheet = await copySheetStructure(
      workbook,
      templateWorksheet,
      workbook,
      secondSheetName,
    );

    currentRow = findFirstEmptyRow(secondWorksheet);
    if (!currentRow) {
      throw new Error(
        `Sheet "${secondSheetName}" đã đầy dữ liệu (hết dòng trống từ row ${START_ROW} đến ${ROW_LIMIT}).`,
      );
    }

    for (const record of completedReports) {
      if (currentRow > ROW_LIMIT) {
        throw new Error(
          `Số lượng báo cáo (${completedReports.length}) vượt quá số dòng trống trong sheet "${secondSheetName}".`,
        );
      }
      writeRecordToRow(secondWorksheet, record, currentRow);
      currentRow++;
    }
  }

  // 8. Ghi file
  const fileName = buildExportFileName();
  const filePath = path.join(EXPORT_DIR, fileName);
  await workbook.xlsx.writeFile(filePath);

  // 9. Lưu lịch sử xuất vào database
  try {
    await exportRunRepo.createExportRun({
      reportDate,
      exportType,
      exportedAt: new Date().toISOString(),
      fileName,
      filePath,
      status: "success",
    });
  } catch (historyError) {
    console.error("⚠️ Không thể lưu lịch sử xuất:", historyError);
    // Không throw error vì file đã xuất thành công
  }

  return { filePath, fileName };
}

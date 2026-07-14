import { START_ROW, ROW_LIMIT, COL_LIMIT } from "@/config/worksheet-config.js";
import { RECORD_SCHEMA } from "@/config/record-schema.js";



function isEmptyRow(ws, rowIndex, maxCol) {
  const row = ws.getRow(rowIndex);
  const sliceEnd = 1 + maxCol;
  const valuesToCheck = row.values.slice(1, sliceEnd);
  return valuesToCheck.every((val) => !val || val.toString().trim() === "");
}

function findEmptyPairRow(
  ws,
  startRow = START_ROW,
  rowLimit = ROW_LIMIT,
  colLimit = COL_LIMIT,
) {
  const maxCol = Math.max(0, Math.trunc(colLimit));
  const effectiveStartRow = Math.max(1, Number(startRow) || 1);
  const maxRow = Math.min(Math.max(effectiveStartRow, rowLimit ?? ROW_LIMIT), ROW_LIMIT);
  const candidateCount = Math.max(
    0,
    Math.floor((maxRow - effectiveStartRow) / 2) + 1,
  );

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
    const cell = row.getCell(col);
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

export async function buildWorkbookFromRecord(record) {
  const workbook = await loadTemplate("Goods");
  const worksheet = workbook.getWorksheet(1);
  const rowIndex = findEmptyPairRow(worksheet);

  if (!rowIndex) {
    throw new Error("No empty row available in the template.");
  }

  Object.entries(RECORD_SCHEMA.excelColumnMap).forEach(([field, column]) => {
    if (record[field] !== undefined) {
      worksheet.getCell(rowIndex, column).value = record[field];
    }
  });

  addBorder(worksheet, rowIndex, Object.values(RECORD_SCHEMA.excelColumnMap));
  return workbook;
}

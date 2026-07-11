import express from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { START_ROW } from "./configs/worksheet-config.js";
import { log } from "console";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);
const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3000;
app.set("view engine", "pug");
app.set("views", path.join(__dirName, "views"));
app.enable("view cache");
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirName, "public")));

// const columnMap = {
//   stt: 1, // A
//   hoTen: 2, // B
//   soThe: 3, // C
//   thuocCtyDonVi: 4, // D
//   bks: 5, // E
//   liDoRaVaoCong: 6, // F
//   nguoiLienHe: 7, // G
//   gioVao: 8, // H
//   gioRa: 9, // I
// };

const columnMap = {
  stt: 1,
  hoTen_ThuocCtyDonVi: 2,
  xuongGiao: 3,
  xuongNhan: 4,
  soThe: 5,
  id: 6,
  loaiPhuongTien_BSX_BKSRomooc: 7,
  soCont_SoSeal : 8,
  chiTietHangHoa: 9,
  soPhieu: 10,
  gioVao: 11,
  gioRa: 12,
  ghiChu: 13
};

function isEmptyRow(ws, rowIndex, maxCol) {
  const row = ws.getRow(rowIndex);
  const sliceEnd = 1 + maxCol;
  const valuesToCheck = row.values.slice(1, sliceEnd);
  return valuesToCheck.every((val) => !val || val.toString().trim() === "");
}

function findEmptyPairRow(
  ws,
  startRow = START_ROW,
  rowLimit = 150,
  colLimit = 13,
) {
  const maxCol = Math.max(0, Math.trunc(colLimit));
  const effectiveStartRow = Math.max(1, Number(startRow) || 1);
  const maxRow = Math.min(Math.max(effectiveStartRow, rowLimit ?? 150), 150);
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

async function loadTemplate(templateName) {
  const filePath = path.join(
    __dirName,
    "__xlsx",
    `${templateName}_Template.xlsx`,
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

function sanitizeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function normalizeTime(value) {
  const text = sanitizeText(value);
  if (!text) return "";

  const match = text.match(/^(\d{1,2})(?:[:.](\d{1,2}))(?:[:.](\d{1,2}))?$/);
  if (!match) return text;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function validateRecordPayload(payload) {
  let parsedPayload = payload;

  if (typeof payload === "string") {
    try {
      parsedPayload = JSON.parse(payload);
    } catch (error) {
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

  const requiredFields = [
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
  ];

  const record = {};
  for (const field of requiredFields) {
    const value = sanitizeText(parsedPayload[field]);
    if (!value) {
      return { ok: false, error: `Missing required field: ${field}` };
    }
    record[field] = field === "stt" ? value : value;
  }

  record.soCont_SoSeal = sanitizeText(
    parsedPayload.soCont_SoSeal ??
      [parsedPayload.soCont, parsedPayload.soSeal]
        .filter((value) => sanitizeText(value))
        .join(" - "),
  );
  if (!/^\d+$/.test(sanitizeText(parsedPayload.stt))) {
    return { ok: false, error: "Field stt must be numeric." };
  }

  const normalizedGioVao = normalizeTime(parsedPayload.gioVao);
  const normalizedGioRa = normalizeTime(parsedPayload.gioRa);
  if (!normalizedGioVao || !normalizedGioRa) {
    return { ok: false, error: "Fields gioVao and gioRa must be valid times." };
  }

  record.stt = sanitizeText(parsedPayload.stt);
  record.hoTen = sanitizeText(parsedPayload.hoTen);
  record.soThe = sanitizeText(parsedPayload.soThe);
  record.thuocCtyDonVi = sanitizeText(parsedPayload.thuocCtyDonVi);
  record.bks = sanitizeText(parsedPayload.bks);
  record.liDoRaVaoCong = sanitizeText(parsedPayload.liDoRaVaoCong);
  record.ghiChu = sanitizeText(parsedPayload.ghiChu);
  record.gioVao = normalizedGioVao;
  record.gioRa = normalizedGioRa;
  record.id = sanitizeText(parsedPayload.id ?? parsedPayload.cccd ?? "");

  return { ok: true, record };
}

async function fillWorkbookWithRecord(record) {
  const workbook = await loadTemplate("Goods");
  const worksheet = workbook.getWorksheet(1);
  const rowIndex = findEmptyPairRow(worksheet);

  if (!rowIndex) {
    throw new Error("No empty row available in the template.");
  }

  Object.entries(columnMap).forEach(([field, column]) => {
    if (record[field] !== undefined) {
      worksheet.getCell(rowIndex, column).value = record[field];
    }
  });

  addBorder(worksheet, rowIndex, Object.values(columnMap));
  return workbook;
}

app.get("/", async (req, res, next) => res.render("index"));

app.get("/api/load-template", async (req, res, next) => {
  let tpwb = await loadTemplate("Goods");
  let ws = tpwb.getWorksheet(1);
  let a2 = ws.getCell("A2");
  return res.json({ data: a2.fill });
});

app.post("/api/write-record", async (req, res) => {
  try {
    const requestPayload = req.body?.tempRecord ?? req.body;
    const validation = validateRecordPayload(requestPayload);
    if (!validation.ok) {
      return res
        .status(400)
        .json({ success: false, message: validation.error });
    }
    console.log('validation.record: ' + validation.record);
    const workbook = await fillWorkbookWithRecord(validation.record);
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="quick-report.xlsx"',
    );
    return res.send(buffer);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to write record." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});

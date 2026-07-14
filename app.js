import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { buildWorkbookFromRecord } from "";
import { validateRequestPayload } from "./services/record-validation.js";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);
const app = express();
const PORT = 3000;
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirName, "public")));

app.use(morgan("combined"))

app.post("/api/write-record", async (req, res) => {
  try {
    const validation = validateRequestPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const workbook = await buildWorkbookFromRecord(validation.record);
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
    return res.status(500).json({ success: false, message: "Failed to write record." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});

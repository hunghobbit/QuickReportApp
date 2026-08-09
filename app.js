import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";

dotenv.config(".env");

import {
  createReport,
  getReportsByDate,
  getReportById,
  updateReport,
} from "./services/report-service.js";
import { exportDayReport } from "./services/excel-export.js";
import * as exportRunRepo from "./database/prisma-export-run-repository.js";
import { login, verifyToken, getUsers } from "./services/auth-service.js";
import { requireAuth, optionalAuth } from "./middleware/auth.js";
import { getPrisma, disconnectPrisma } from "./database/prisma-client.js";
import { generateReport, generateReportFromImages, isAIConfigured } from "./server/ai/index.js";
import multer from "multer";


// Configure multer for image uploads (max 10 images, 10MB each)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10, // max 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."), false);
    }
  },
});

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_LEVEL = process.env.LOG_LEVEL || "combined"

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n💾 Đang đóng kết nối database...");
  await disconnectPrisma();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n💾 Đang đóng kết nối database...");
  await disconnectPrisma();
  process.exit(0);
});

app.use(cors());
app.use(express.json());
app.use(morgan(LOG_LEVEL));

// ─── API Auth ──────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp tên đăng nhập và mật khẩu.",
      });
    }

    const result = await login(name, password);
    if (!result.success) {
      return res.status(401).json({ success: false, message: result.error });
    }

    return res.status(200).json({
      success: true,
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (error) {
    console.error("[POST /api/auth/login] Server error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi đăng nhập.",
    });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
});

app.get("/api/users", requireAuth, async (req, res) => {
  try {
    const users = await getUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("[GET /api/users] Server error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Không thể lấy danh sách người dùng.",
    });
  }
});

// ─── API Tạo báo cáo ──────────────────────────────────────────
app.post("/api/reports", optionalAuth, async (req, res) => {
  try {
    const result = await createReport(req.body, "draft", req.user);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    return res.status(201).json({ success: true, data: result.data });
  } catch (error) {
    console.error("[POST /api/reports] Server error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to create report." });
  }
});

// ─── API Lấy danh sách báo cáo theo ngày ──────────────────────────
app.get("/api/reports", async (req, res) => {
  try {
    const { date } = req.query;
    const result = await getReportsByDate(date);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("[GET /api/reports] Server error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to fetch reports." });
  }
});

// ─── API Xuất Excel báo cáo theo ngày (phải đặt trước route :id để tránh xung đột) ──
app.get("/api/reports/export/:date", async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ success: false, message: "Date must be in YYYY-MM-DD format." });
    }

    const result = await exportDayReport(date);

    // Gửi file về client
    res.download(result.filePath, result.fileName, (err) => {
      if (err) {
        console.error("[GET /api/reports/export/:date] Download error:", err);
        // Nếu lỗi xảy ra sau khi đã gửi header, chỉ log
        if (!res.headersSent) {
          return res
            .status(500)
            .json({ success: false, message: "Không thể tải file xuống." });
        }
      }
    });
  } catch (error) {
    console.error("[GET /api/reports/export/:date] Error:", error);
    const statusCode = error.message.includes("Không có báo cáo") ? 404 : 500;
    return res
      .status(statusCode)
      .json({ success: false, message: error.message || "Failed to export Excel." });
  }
});

// ─── API Lấy chi tiết báo cáo ─────────────────────────────────────
app.get("/api/reports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid report ID." });
    }

    const result = await getReportById(id);
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("[GET /api/reports/:id] Server error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to fetch report." });
  }
});

// ─── API Cập nhật báo cáo ─────────────────────────────────────────
app.put("/api/reports/:id", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid report ID." });
    }

    const result = await updateReport(id, req.body, req.user);
    if (!result.success) {
      // Phân biệt lỗi 404 và 400
      const statusCode = result.error === "Report not found." ? 404 : 400;
      return res.status(statusCode).json({ success: false, message: result.error });
    }
    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("[PUT /api/reports/:id] Server error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to update report." });
  }
});

// ─── API Lấy lịch sử xuất theo ngày ───────────────────────────────
app.get("/api/reports/export/history/:date", async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ success: false, message: "Date must be in YYYY-MM-DD format." });
    }

    const history = await exportRunRepo.getExportRunsByDate(date);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("[GET /api/reports/export/history/:date] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to fetch export history." });
  }
});

// ─── API Lấy lịch sử xuất theo khoảng ngày ────────────────────────
app.get("/api/reports/export/history", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ success: false, message: "startDate and endDate are required (YYYY-MM-DD)." });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res
        .status(400)
        .json({ success: false, message: "Dates must be in YYYY-MM-DD format." });
    }

    const history = await exportRunRepo.getExportRunsByDateRange(startDate, endDate);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    console.error("[GET /api/reports/export/history] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to fetch export history." });
  }
});

// ─── API AI Report Generator ─────────────────────────────────────
// POST /api/ai/generate-report
// Body: { userInput: { companyName, transportCompany }, ocr: { idCard, licensePlate, container, seal, invoice, goods } }
// Response: { success, data: { report, fields, found, missing, warnings } }
app.post("/api/ai/generate-report", optionalAuth, async (req, res) => {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "AI service is not configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY in the .env file.",
      });
    }

    const { userInput, ocr } = req.body || {};

    if (!ocr && !userInput) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain 'userInput' and/or 'ocr' fields.",
      });
    }

    const result = await generateReport({ userInput, ocr });
    if (!result.success) {
      return res
        .status(result.statusCode || 500)
        .json({ success: false, message: result.error });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("[POST /api/ai/generate-report] Server error:", error);
    return res
      .status(500)
      .json({ success: false, message: error.message || "Failed to generate AI report." });
  }
});

// ─── API AI Report Generator from Images (Multimodal) ───────────────
// POST /api/ai/generate-report-from-images
// Body: multipart/form-data with images[] (image files) + companyName + transportCompany
// Response: { success, data: { report, fields, found, missing, warnings, record } }
app.post("/api/ai/generate-report-from-images", optionalAuth, upload.array("images", 10), async (req, res) => {
  try {
    if (!isAIConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "AI service is not configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY in the .env file.",
      });
    }

    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required.",
      });
    }

    // Convert files to base64
    const images = files.map((file) => ({
      data: file.buffer.toString("base64"),
      mimeType: file.mimetype,
    }));

    const userInput = {
      reportType: req.body.reportType || "",
      team: req.user?.team || req.body.team || "",
      companyName: req.body.companyName || "",
      transportCompany: req.body.transportCompany || "",
      xuongGiao: req.body.xuongGiao || "",
      xuongNhan: req.body.xuongNhan || "",
      goodsDetails: req.body.goodsDetails || "",
      reason: req.body.reason || "",
    };

    const result = await generateReportFromImages({ userInput, images });
    if (!result.success) {
      return res
        .status(result.statusCode || 500)
        .json({ success: false, message: result.error });
    }

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("[POST /api/ai/generate-report-from-images] Server error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI report from images.",
    });
  }
});

// GET /api/ai/status — Check if AI service is configured
app.get("/api/ai/status", (req, res) => {
  return res.status(200).json({
    success: true,
    data: { configured: isAIConfigured() },
  });
});

// ─── Khởi động server ─────────────────────────────────────────────
async function startServer() {
  try {
    // Initialize Prisma before starting server
    const prisma = getPrisma();
    await prisma.$connect();
    console.log("✅ Đã kết nối Prisma database");

    app.listen(PORT, () => {
      console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Không thể khởi động server:", error);
    process.exit(1);
  }
}

startServer();

import express from "express";
import cors from "cors";
import morgan from "morgan";
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

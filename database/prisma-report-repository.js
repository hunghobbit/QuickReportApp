// database/prisma-report-repository.js
// Repository cho Report model sử dụng Prisma ORM.
// Cung cấp interface CRUD tương thích với service layer.
// Service layer dùng camelCase, Prisma model dùng snake_case cho một số field.

import { getPrisma } from "./prisma-client.js";
import { getReportStatus } from "../services/report-status.js";

/**
 * Map một record từ Prisma (snake_case) sang service format (camelCase).
 * Chuyển `giayTo` → `businessId` để tương thích với service layer.
 */
function mapPrismaReportToService(prismaReport) {
  if (!prismaReport) return null;

  return {
    id: prismaReport.id,
    reportDate: prismaReport.reportDate,
    stt: prismaReport.stt,
    hoTen_ThuocCtyDonVi: prismaReport.hoTen_ThuocCtyDonVi,
    xuongGiao: prismaReport.xuongGiao,
    xuongNhan: prismaReport.xuongNhan,
    soThe: prismaReport.soThe,
    businessId: prismaReport.giayTo || "",
    loaiPhuongTien_BSX_BKSRomooc: prismaReport.loaiPhuongTien_BSX_BKSRomooc,
    soCont_SoSeal: prismaReport.soCont_SoSeal,
    chiTietHangHoa: prismaReport.chiTietHangHoa,
    soPhieu: prismaReport.soPhieu,
    gioVao: prismaReport.gioVao,
    gioRa: prismaReport.gioRa,
    ghiChu: prismaReport.ghiChu,
    rawText: prismaReport.rawText,
    status: prismaReport.status,
    reportType: prismaReport.reportType,
    userId: prismaReport.userId,
    createdAt: prismaReport.createdAt?.toISOString?.() || prismaReport.createdAt,
    updatedAt: prismaReport.updatedAt?.toISOString?.() || prismaReport.updatedAt,
  };
}

/**
 * Map dữ liệu từ service (camelCase) sang Prisma model fields.
 * Chuyển `businessId` → `giayTo`, `rawText` → `rawText` (giống tên).
 */
function mapServiceToPrisma(report) {
  const data = {};

  if (report.reportDate !== undefined) data.reportDate = report.reportDate;
  if (report.stt !== undefined) data.stt = report.stt;
  if (report.hoTen_ThuocCtyDonVi !== undefined) data.hoTen_ThuocCtyDonVi = report.hoTen_ThuocCtyDonVi;
  if (report.xuongGiao !== undefined) data.xuongGiao = report.xuongGiao;
  if (report.xuongNhan !== undefined) data.xuongNhan = report.xuongNhan;
  if (report.soThe !== undefined) data.soThe = report.soThe;
  if (report.businessId !== undefined) data.giayTo = report.businessId;
  if (report.loaiPhuongTien_BSX_BKSRomooc !== undefined) data.loaiPhuongTien_BSX_BKSRomooc = report.loaiPhuongTien_BSX_BKSRomooc;
  if (report.soCont_SoSeal !== undefined) data.soCont_SoSeal = report.soCont_SoSeal;
  if (report.chiTietHangHoa !== undefined) data.chiTietHangHoa = report.chiTietHangHoa;
  if (report.soPhieu !== undefined) data.soPhieu = report.soPhieu;
  if (report.gioVao !== undefined) data.gioVao = report.gioVao;
  if (report.gioRa !== undefined) data.gioRa = report.gioRa;
  if (report.ghiChu !== undefined) data.ghiChu = report.ghiChu;
  if (report.rawText !== undefined) data.rawText = report.rawText;
  if (report.status !== undefined) data.status = report.status;
  if (report.reportType !== undefined) data.reportType = report.reportType;
  if (report.userId !== undefined) data.userId = report.userId;

  return data;
}

/**
 * Tạo báo cáo mới.
 * Tự động tính status dựa trên gioRa.
 *
 * @param {object} report - Report data (camelCase)
 * @returns {Promise<object>} Report đã tạo (camelCase)
 */
export async function createReport(report) {
  const prisma = getPrisma();

  // Tự động tính status nếu chưa có
  const status = report.status || getReportStatus(report);

  const prismaData = mapServiceToPrisma({
    ...report,
    status,
  });

  const created = await prisma.report.create({
    data: prismaData,
  });

  return mapPrismaReportToService(created);
}

/**
 * Lấy danh sách báo cáo theo ngày.
 *
 * @param {string} reportDate - YYYY-MM-DD
 * @returns {Promise<object[]>}
 */
export async function getReportsByDate(reportDate) {
  const prisma = getPrisma();

  const reports = await prisma.report.findMany({
    where: { reportDate },
    orderBy: { id: "asc" },
  });

  return reports.map(mapPrismaReportToService);
}

/**
 * Lấy chi tiết một báo cáo theo ID.
 *
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export async function getReportById(id) {
  const prisma = getPrisma();

  const report = await prisma.report.findUnique({
    where: { id },
  });

  return mapPrismaReportToService(report);
}

/**
 * Cập nhật một báo cáo.
 * Tự động tính lại status dựa trên gioRa sau khi merge với dữ liệu cũ.
 *
 * @param {number} id
 * @param {object} updates - Các field cần cập nhật (camelCase)
 * @returns {Promise<object|null>} Report đã cập nhật, hoặc null nếu không tìm thấy
 */
export async function updateReport(id, updates) {
  const prisma = getPrisma();

  // Lấy bản ghi hiện tại
  const existing = await prisma.report.findUnique({
    where: { id },
  });

  if (!existing) return null;

  // Merge updates với dữ liệu cũ để tính lại status
  const merged = {
    ...mapPrismaReportToService(existing),
    ...updates,
  };

  // Tự động tính lại status từ gioRa
  const newStatus = getReportStatus(merged);

  const prismaData = mapServiceToPrisma({
    ...updates,
    status: newStatus,
  });

  const updated = await prisma.report.update({
    where: { id },
    data: prismaData,
  });

  return mapPrismaReportToService(updated);
}

/**
 * Xóa một báo cáo.
 *
 * @param {number} id
 * @returns {Promise<boolean>} true nếu xóa thành công, false nếu không tìm thấy
 */
export async function deleteReport(id) {
  const prisma = getPrisma();

  try {
    await prisma.report.delete({
      where: { id },
    });
    return true;
  } catch (error) {
    if (error.code === "P2025") {
      // Record not found
      return false;
    }
    throw error;
  }
}

/**
 * Lấy danh sách báo cáo theo ngày và trạng thái.
 *
 * @param {string} reportDate - YYYY-MM-DD
 * @param {string} status - 'pending' | 'completed'
 * @returns {Promise<object[]>}
 */
export async function getReportsByStatus(reportDate, status) {
  const prisma = getPrisma();

  const reports = await prisma.report.findMany({
    where: {
      reportDate,
      status,
    },
    orderBy: { id: "asc" },
  });

  return reports.map(mapPrismaReportToService);
}

export default {
  createReport,
  getReportsByDate,
  getReportById,
  updateReport,
  deleteReport,
  getReportsByStatus,
};
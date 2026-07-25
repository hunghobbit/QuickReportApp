// database/prisma-export-run-repository.js
// Repository cho ExportRun model sử dụng Prisma ORM.
// Quản lý lịch sử xuất Excel và chống xuất trùng.

import { getPrisma } from "./prisma-client.js";

/**
 * Map một record từ Prisma sang service format.
 * Chuyển snake_case field names từ DB sang camelCase.
 */
function mapPrismaExportRunToService(exportRun) {
  if (!exportRun) return null;

  return {
    id: exportRun.id,
    reportDate: exportRun.reportDate,
    exportType: exportRun.exportType,
    exportedAt: exportRun.exportedAt?.toISOString?.() || exportRun.exportedAt,
    fileName: exportRun.fileName,
    filePath: exportRun.filePath,
    status: exportRun.status,
    errorMessage: exportRun.errorMessage || "",
    createdAt: exportRun.createdAt?.toISOString?.() || exportRun.createdAt,
  };
}

/**
 * Map dữ liệu từ service sang Prisma model fields.
 */
function mapServiceToPrisma(data) {
  const prismaData = {};

  if (data.reportDate !== undefined) prismaData.reportDate = data.reportDate;
  if (data.exportType !== undefined) prismaData.exportType = data.exportType;
  if (data.exportedAt !== undefined) prismaData.exportedAt = new Date(data.exportedAt);
  if (data.fileName !== undefined) prismaData.fileName = data.fileName;
  if (data.filePath !== undefined) prismaData.filePath = data.filePath;
  if (data.status !== undefined) prismaData.status = data.status;
  if (data.errorMessage !== undefined) prismaData.errorMessage = data.errorMessage;

  return prismaData;
}

/**
 * Tạo bản ghi lịch sử xuất mới.
 *
 * @param {object} exportRun - { reportDate, exportType, exportedAt, fileName, filePath, status, errorMessage? }
 * @returns {Promise<object>}
 */
export async function createExportRun(exportRun) {
  const prisma = getPrisma();

  const prismaData = mapServiceToPrisma(exportRun);

  const created = await prisma.exportRun.create({
    data: prismaData,
  });

  return mapPrismaExportRunToService(created);
}

/**
 * Kiểm tra đã có lượt xuất thành công cho ngày và loại xuất chưa.
 * Dùng để chống xuất trùng cho automatic export.
 *
 * @param {string} reportDate - YYYY-MM-DD
 * @param {string} exportType - 'manual' | 'automatic'
 * @returns {Promise<boolean>}
 */
export async function hasSuccessfulExport(reportDate, exportType) {
  const prisma = getPrisma();

  const count = await prisma.exportRun.count({
    where: {
      reportDate,
      exportType,
      status: "success",
    },
  });

  return count > 0;
}

/**
 * Lấy lịch sử xuất theo ngày.
 *
 * @param {string} reportDate - YYYY-MM-DD
 * @returns {Promise<object[]>}
 */
export async function getExportRunsByDate(reportDate) {
  const prisma = getPrisma();

  const runs = await prisma.exportRun.findMany({
    where: { reportDate },
    orderBy: { exportedAt: "desc" },
  });

  return runs.map(mapPrismaExportRunToService);
}

/**
 * Lấy lịch sử xuất theo khoảng ngày.
 *
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<object[]>}
 */
export async function getExportRunsByDateRange(startDate, endDate) {
  const prisma = getPrisma();

  const runs = await prisma.exportRun.findMany({
    where: {
      reportDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { exportedAt: "desc" },
  });

  return runs.map(mapPrismaExportRunToService);
}

/**
 * Lấy lượt xuất gần nhất theo ngày và loại.
 *
 * @param {string} reportDate - YYYY-MM-DD
 * @param {string} exportType - 'manual' | 'automatic'
 * @returns {Promise<object|null>}
 */
export async function getLatestExportRun(reportDate, exportType) {
  const prisma = getPrisma();

  const run = await prisma.exportRun.findFirst({
    where: {
      reportDate,
      exportType,
    },
    orderBy: { exportedAt: "desc" },
  });

  return mapPrismaExportRunToService(run);
}

export default {
  createExportRun,
  hasSuccessfulExport,
  getExportRunsByDate,
  getExportRunsByDateRange,
  getLatestExportRun,
};
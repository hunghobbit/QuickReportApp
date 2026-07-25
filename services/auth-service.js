// services/auth-service.js
// Service xác thực người dùng: login, verify token, quản lý user.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPrisma } from "../database/prisma-client.js";

const JWT_SECRET = process.env.JWT_SECRET || "quick-report-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Đăng nhập bằng tên và mật khẩu.
 * @param {string} name - Tên user ("Đội ELA" | "Đội DTA")
 * @param {string} password - Mật khẩu
 * @returns {Promise<{ success: boolean, token?: string, user?: object, error?: string }>}
 */
export async function login(name, password) {
  try {
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({ where: { name } });

    if (!user) {
      return { success: false, error: "Tài khoản không tồn tại." };
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: "Mật khẩu không đúng." };
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, team: user.team },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        team: user.team,
      },
    };
  } catch (err) {
    console.error("[auth-service] login error:", err);
    return { success: false, error: err.message || "Lỗi đăng nhập." };
  }
}

/**
 * Xác thực token JWT.
 * @param {string} token
 * @returns {{ success: boolean, user?: object, error?: string }}
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      user: {
        id: decoded.id,
        name: decoded.name,
        team: decoded.team,
      },
    };
  } catch (err) {
    return { success: false, error: "Token không hợp lệ hoặc đã hết hạn." };
  }
}

/**
 * Lấy danh sách tất cả user.
 * @returns {Promise<object[]>}
 */
export async function getUsers() {
  const prisma = getPrisma();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, team: true, createdAt: true },
    orderBy: { id: "asc" },
  });
  return users;
}

/**
 * Tạo user mới (dùng cho seed hoặc admin).
 * @param {object} params - { name, team, password }
 * @returns {Promise<object>}
 */
export async function createUser({ name, team, password }) {
  const prisma = getPrisma();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, team, passwordHash },
    select: { id: true, name: true, team: true, createdAt: true },
  });

  return user;
}

export default { login, verifyToken, getUsers, createUser };

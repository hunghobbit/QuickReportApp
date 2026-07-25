// middleware/auth.js
// Middleware xác thực JWT cho Express routes.
import { verifyToken } from "../services/auth-service.js";

/**
 * Middleware yêu cầu xác thực — từ chối nếu không có token hợp lệ.
 * Gắn req.user nếu thành công.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Thiếu token xác thực. Vui lòng đăng nhập.",
    });
  }

  const token = authHeader.split(" ")[1];
  const result = verifyToken(token);

  if (!result.success) {
    return res.status(401).json({
      success: false,
      message: result.error,
    });
  }

  req.user = result.user;
  next();
}

/**
 * Middleware xác thực tùy chọn — nếu có token hợp lệ thì gắn req.user,
 * nếu không thì vẫn cho qua (req.user = null).
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const result = verifyToken(token);
    if (result.success) {
      req.user = result.user;
    }
  }
  next();
}

export default { requireAuth, optionalAuth };

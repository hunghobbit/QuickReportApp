// contexts/AuthContext.jsx
// Quản lý trạng thái xác thực người dùng (JWT token + user info).
import { createContext, useContext, useState, useEffect } from "react";
import { login as apiLogin, getToken, setToken, removeToken, isTokenExpired } from "@/utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Khởi tạo token/user từ localStorage, kiểm tra hạn token
  const [token, setTokenState] = useState(() => {
    const stored = getToken();
    if (stored && !isTokenExpired(stored)) {
      return stored;
    }
    // Token hết hạn hoặc không hợp lệ → xóa
    removeToken();
    return null;
  });

  const [user, setUserState] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Lắng nghe sự kiện logout từ API (khi nhận được 401)
  useEffect(() => {
    const handleLogout = () => {
      setTokenState(null);
      setUserState(null);
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  /**
   * Đăng nhập.
   * @param {string} name - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  const login = async (name, password) => {
    setIsLoading(true);
    try {
      const data = await apiLogin(name, password);
      const { token: newToken, user: newUser } = data.data;

      // Lưu vào localStorage
      setToken(newToken);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Cập nhật state
      setTokenState(newToken);
      setUserState(newUser);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message || "Đăng nhập thất bại." };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Đăng xuất.
   */
  const logout = () => {
    removeToken();
    setTokenState(null);
    setUserState(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook dùng để truy cập trạng thái xác thực.
 * Phải được dùng trong AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng trong AuthProvider");
  }
  return context;
};

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://quick-report-api.onrender.com/api'  // Production
  : '/api';  // Development

// ─── Token helpers ───────────────────────────────────────────────
/**
 * Lấy JWT token từ localStorage.
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * Lưu JWT token vào localStorage.
 * @param {string} token
 */
export function setToken(token) {
  localStorage.setItem("token", token);
}

/**
 * Xóa JWT token khỏi localStorage.
 */
export function removeToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/**
 * Kiểm tra token JWT đã hết hạn chưa.
 * @param {string} token
 * @returns {boolean} true nếu đã hết hạn hoặc không hợp lệ
 */
export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ─── Core request ────────────────────────────────────────────────
/**
 * Send request to the backend API.
 * @param {string} path - API path (e.g., "/reports")
 * @param {object} [options] - Fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
async function request(path, options = {}) {
  const token = getToken();
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  // Nếu token không hợp lệ (401), tự động đăng xuất
  if (res.status === 401) {
    removeToken();
    window.dispatchEvent(new Event("auth:logout"));
  }

  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON (e.g., HTML error page), use default message
    }
    throw new Error(errorMessage);
  }

  const data = await res.json();
  return data;
}

// ─── Auth API ────────────────────────────────────────────────────
/**
 * Đăng nhập bằng tên và mật khẩu.
 * @param {string} name - Tên đăng nhập
 * @param {string} password - Mật khẩu
 * @returns {Promise<object>} { success, data: { token, user } }
 */
export function login(name, password) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  });
}

// ─── Report API ──────────────────────────────────────────────────
/**
 * Create a new report.
 * @param {object} payload - { reportDate, ...recordFields, mode? }
 * @returns {Promise<object>}
 */
export function createReport(payload) {
  return request("/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Get reports by date.
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<object>}
 */
export function getReportsByDate(date) {
  return request(`/reports?date=${encodeURIComponent(date)}`);
}

/**
 * Get a report by ID.
 * @param {number} id
 * @returns {Promise<object>}
 */
export function getReportById(id) {
  return request(`/reports/${id}`);
}

/**
 * Update a report.
 * @param {number} id
 * @param {object} updates
 * @returns {Promise<object>}
 */
export function updateReport(id, updates) {
  return request(`/reports/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * Xuất Excel báo cáo theo ngày.
 * Dùng fetch trực tiếp để xử lý download file blob.
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<void>}
 */
export async function exportExcel(date) {
  const token = getToken();
  const res = await fetch(`/api/reports/export/${encodeURIComponent(date)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Không thể xuất Excel." }));
    throw new Error(error.message || `Export failed (${res.status})`);
  }

  // Lấy filename từ Content-Disposition header, fallback về tên mặc định
  const disposition = res.headers.get("Content-Disposition") || "";
  const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?([^;\s]+)/i);
  const filename = filenameMatch
    ? decodeURIComponent(filenameMatch[1])
    : `Báo cáo ${date}.xlsx`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

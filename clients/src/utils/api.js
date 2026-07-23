const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://quick-report-api.onrender.com/api'  // Production
  : '/api';  // Development
/**
 * Send request to the backend API.
 * @param {string} path - API path (e.g., "/reports")
 * @param {object} [options] - Fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

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
  const res = await fetch(`/api/reports/export/${encodeURIComponent(date)}`);
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

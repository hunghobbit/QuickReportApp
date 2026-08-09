// clients/src/features/ai/watermark.js
// Watermark (dấu mờ) — vẽ timestamp, tên công ty, địa điểm, GPS lên ảnh.
// Tham khảo ứng dụng Timemark: dấu mờ ở góc dưới ảnh, không thể chỉnh sửa.

/**
 * Format timestamp theo định dạng DD/MM/YYYY HH:mm:ss.
 * @param {Date} date
 * @returns {string}
 */
export function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Lấy vị trí GPS hiện tại (không bắt buộc).
 * Nếu user từ chối hoặc không có GPS → trả về null.
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
export function getCurrentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve(null), // Từ chối hoặc lỗi → null
      { timeout: 5000, maximumAge: 0, enableHighAccuracy: true },
    );
  });
}

/**
 * Tạo chuỗi watermark hiển thị trên ảnh.
 *
 * @param {object} params
 * @param {string} params.companyName - Tên công ty/đơn vị (từ user login)
 * @param {string} params.location - Địa điểm (người dùng nhập tay)
 * @param {{ latitude: number, longitude: number } | null} params.coords - Tọa độ GPS
 * @param {Date} params.date - Thời điểm chụp
 * @returns {string[]} Mảng các dòng text watermark
 */
export function getWatermarkLines({
  companyName = "",
  location = "",
  coords = null,
  date = new Date(),
} = {}) {
  const lines = [];

  // Dòng 1: Tên công ty + timestamp
  const company = companyName.trim() || "Không xác định";
  lines.push(`${company} | ${formatTimestamp(date)}`);

  // Dòng 2: Địa điểm
  if (location.trim()) {
    lines.push(`Địa điểm: ${location.trim()}`);
  }

  // Dòng 3: GPS
  if (coords && typeof coords.latitude === "number" && typeof coords.longitude === "number") {
    lines.push(`GPS: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
  } else {
    lines.push("GPS: Không xác định");
  }

  return lines;
}

/**
 * Vẽ watermark lên ảnh (canvas) và trả về dataURL.
 * Watermark nằm ở góc dưới ảnh, nền bán trong suốt, chữ trắng.
 *
 * @param {object} params
 * @param {string} params.imageSrc - Nguồn ảnh (dataURL hoặc URL)
 * @param {string[]} params.lines - Các dòng text watermark
 * @param {string} params.mimeType - MIME type ảnh xuất ra (mặc định image/jpeg)
 * @param {number} params.quality - Chất lượng JPEG (0-1, mặc định 0.9)
 * @returns {Promise<{ dataUrl: string, mimeType: string }>}
 */
export async function applyWatermark({
  imageSrc,
  lines = [],
  mimeType = "image/jpeg",
  quality = 0.9,
} = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");

        // Vẽ ảnh gốc
        ctx.drawImage(img, 0, 0);

        // Vẽ nền watermark ở góc dưới (bán trong suốt)
        const fontSize = Math.max(14, Math.round(canvas.width * 0.018));
        ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textBaseline = "bottom";

        // Đo chiều rộng dòng dài nhất để tính kích thước nền
        const lineHeight = fontSize * 1.4;
        const padding = fontSize * 0.8;
        const maxLineWidth = Math.max(
          ...lines.map((line) => ctx.measureText(line).width),
          0,
        );

        const boxWidth = maxLineWidth + padding * 2;
        const boxHeight = lines.length * lineHeight + padding * 2;
        const boxX = canvas.width - boxWidth - padding;
        const boxY = canvas.height - boxHeight - padding;

        // Nền đen bán trong suốt
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Viền trắng mảnh
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Vẽ text trắng
        ctx.fillStyle = "#ffffff";
        lines.forEach((line, i) => {
          const textY = boxY + padding + (i + 1) * lineHeight - fontSize * 0.2;
          ctx.fillText(line, boxX + padding, textY);
        });

        // Xuất dataURL
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({ dataUrl, mimeType });
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Không thể tải ảnh để vẽ watermark."));
    img.src = imageSrc;
  });
}

/**
 * Chụp ảnh từ video stream (camera) và vẽ watermark ngay lập tức.
 *
 * @param {object} params
 * @param {HTMLVideoElement} params.video - Video element đang phát camera
 * @param {string[]} params.lines - Các dòng text watermark
 * @param {string} params.mimeType - MIME type ảnh xuất ra
 * @returns {Promise<{ dataUrl: string, mimeType: string }>}
 */
export async function captureFromVideo({ video, lines = [], mimeType = "image/jpeg" }) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  // Vẽ frame hiện tại từ video
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Vẽ watermark
  const fontSize = Math.max(14, Math.round(canvas.width * 0.018));
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textBaseline = "bottom";

  const lineHeight = fontSize * 1.4;
  const padding = fontSize * 0.8;
  const maxLineWidth = Math.max(
    ...lines.map((line) => ctx.measureText(line).width),
    0,
  );

  const boxWidth = maxLineWidth + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;
  const boxX = canvas.width - boxWidth - padding;
  const boxY = canvas.height - boxHeight - padding;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  ctx.fillStyle = "#ffffff";
  lines.forEach((line, i) => {
    const textY = boxY + padding + (i + 1) * lineHeight - fontSize * 0.2;
    ctx.fillText(line, boxX + padding, textY);
  });

  const dataUrl = canvas.toDataURL(mimeType, 0.9);
  return { dataUrl, mimeType };
}

/**
 * Tải dataURL về máy dưới dạng file ảnh.
 *
 * @param {object} params
 * @param {string} params.dataUrl - Data URL ảnh đã watermark
 * @param {string} params.fileName - Tên file
 * @param {string} params.mimeType - MIME type ảnh
 * @returns {boolean}
 */
export function downloadDataUrl({ dataUrl, fileName = "watermarked-image", mimeType = "image/jpeg" } = {}) {
  if (typeof dataUrl !== "string" || dataUrl.length === 0) return false;

  const safeFileName = (fileName || "watermarked-image").trim() || "watermarked-image";
  const extension = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : mimeType.includes("gif") ? "gif" : "jpg";
  const targetName = safeFileName.toLowerCase().endsWith(`.${extension}`)
    ? safeFileName
    : `${safeFileName}.${extension}`;

  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = targetName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  return true;
}

export default {
  formatTimestamp,
  getCurrentPosition,
  getWatermarkLines,
  applyWatermark,
  captureFromVideo,
  downloadDataUrl,
};
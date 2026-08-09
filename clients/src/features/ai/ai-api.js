// clients/src/features/ai/ai-api.js
// AI Report Generator API client — gọi các endpoint AI phía backend.

const API_BASE =
    process.env.NODE_ENV === "production"
        ? "https://quick-report-api.onrender.com/api"
        : "/api";

/**
 * Lấy JWT token từ localStorage.
 * @returns {string|null}
 */
function getToken() {
    return localStorage.getItem("token");
}

/**
 * Gọi API tạo báo cáo từ ảnh (multimodal).
 * Gửi ảnh dạng multipart/form-data lên backend.
 *
 * @param {object} params
 * @param {Array<{ data: string, mimeType: string }>} params.images - Mảng ảnh base64
 * @param {string} params.companyName - Tên công ty/đơn vị
 * @param {string} params.transportCompany - Công ty vận chuyển
 * @param {string} params.goodsDetails - Chi tiết hàng hóa
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 *   data: { report, fields, found, missing, warnings, record }
 */
export async function generateReportFromImages({
    reportType = "Nhập",
    goodsDetails = "",
    images = [],
    companyName = "",
    transportCompany = "",
    reason = "",
    team = "",
    xuongGiao = "",
    xuongNhan = "",
} = {}) {
    const token = getToken();
    const formData = new FormData();
    // Lọc ra những ảnh hợp lệ (có data)
    const validImages = images.filter((img) => {
        const imageData =
            typeof img?.data === "string" ? img.data : img?.dataUrl;
        return typeof imageData === "string" && imageData.length > 0;
    });
    // Nếu không có ảnh hợp lệ, trả về lỗi
    if (validImages.length === 0) {
        return {
            success: false,
            message: "Không có ảnh hợp lệ để gửi lên AI.",
        };
    }

    // Chuyển base64/dataURL → Blob rồi append vào FormData
    validImages.forEach((img, index) => {
        const imageData =
            typeof img?.data === "string" ? img.data : img?.dataUrl;
        const mimeType = img?.mimeType || "image/jpeg";
        const blob = dataUrlToBlob(imageData, mimeType);
        formData.append(
            "images",
            blob,
            `image-${index + 1}.${mimeToExt(mimeType)}`,
        );
    });
    // Thêm các trường nghiệp vụ vào FormData để backend dựng prompt chính xác.
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const resolvedTeam = (team || user.team || "").trim();

    formData.append("reportType", reportType);
    formData.append("team", resolvedTeam);
    formData.append("xuongGiao", xuongGiao || "");
    formData.append("xuongNhan", xuongNhan || "");
    formData.append("reason", reason || "");

    formData.append("companyName", companyName);
    formData.append("transportCompany", transportCompany);
    formData.append("goodsDetails", goodsDetails || "");

    const res = await fetch(`${API_BASE}/ai/generate-report-from-images`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
    });

    // Xử lý 401 → đăng xuất
    if (res.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth:logout"));
    }

    const data = await res.json().catch(() => ({
        success: false,
        message: "Không thể đọc phản hồi từ server.",
    }));

    if (!res.ok) {
        return {
            success: false,
            message: data.message || `Request failed (${res.status})`,
        };
    }

    return data;
}

/**
 * Kiểm tra AI service đã được cấu hình chưa.
 * @returns {Promise<{ success: boolean, data?: { configured: boolean }, message?: string }>}
 */
export async function getAIStatus() {
    const token = getToken();
    const res = await fetch(`${API_BASE}/ai/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    const data = await res.json().catch(() => ({
        success: false,
        message: "Không thể đọc phản hồi từ server.",
    }));
    return data;
}

/**
 * Chuyển dataURL (base64) → Blob.
 * @param {string} dataUrl - VD: "data:image/jpeg;base64,..."
 * @param {string} mimeType - VD: "image/jpeg"
 * @returns {Blob}
 */
export function dataUrlToBlob(dataUrl, mimeType = "image/jpeg") {
    if (typeof dataUrl !== "string" || dataUrl.length === 0) {
        throw new Error("Ảnh không hợp lệ hoặc bị thiếu dữ liệu.");
    }

    // Nếu dataUrl đã có prefix "data:...;base64," thì tách phần base64
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

/**
 * Chuyển MIME type → phần mở rộng file.
 * @param {string} mimeType
 * @returns {string}
 */
export function mimeToExt(mimeType) {
    const map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/bmp": "bmp",
    };
    return map[mimeType] || "jpg";
}

export default {
    generateReportFromImages,
    getAIStatus,
    dataUrlToBlob,
    mimeToExt,
};

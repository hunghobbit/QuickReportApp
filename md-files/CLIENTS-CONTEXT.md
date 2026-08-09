# CLIENTS-CONTEXT — Frontend React/Vite

> Cập nhật lần cuối: 2026-08-08
> Phạm vi: clients/

## Tổng quan

Frontend được xây dựng bằng React 19 + Vite 8 và Tailwind CSS. Giao diện hiện tại tập trung vào luồng báo cáo và AI generation.

## Cấu trúc chính

- App.jsx: điều phối màn hình chính, modal chỉnh sửa, report tabs
- components/report/: các thành phần form, tabs, card, modal
- components/ai/: AI report generator, camera capture, result box
- contexts/AuthContext.jsx: quản lý auth và token
- contexts/ExportContext.jsx: context cho export và modal form init values
- features/report/: parser, validator, status rules
- features/ai/: API client và watermark utilities

## Chức năng hiện có

- Đăng nhập
- Chọn ngày báo cáo
- Tạo, sửa, xem báo cáo
- Chia báo cáo thành tab pending/completed
- Xuất Excel từ UI
- Chụp ảnh và tạo báo cáo bằng AI

## Mô hình dữ liệu frontend

Frontend dùng các field tên chuẩn từ configs/record-schema.js và gửi dữ liệu cho backend qua API JSON hoặc multipart/form-data cho AI.

## Điểm cần nhớ

- Không đặt logic nghiệp vụ quan trọng trong component nếu có thể đưa sang service hoặc shared config.
- UI hiện đang dùng modal để nhập/chỉnh sửa báo cáo.
- AI flow hiện là luồng chính khi tạo báo cáo mới.

---

*File này được cập nhật tự động — QuickReportApp Frontend Context*

### report/

#### ReportForm.jsx

- Render form grid (2 columns trên desktop)
- Duyệt `RECORD_SCHEMA.formFields` để tạo field
- Gọi `ReportField` cho từng trường
- Props: `form`, `setForm`, `errors`, `onFieldChange`

#### ReportField.jsx

- Component input/textarea cho từng trường
- Textarea cho: `chiTietHangHoa`, `ghiChu`
- Input cho các trường còn lại
- Hiển thị lỗi dưới mỗi trường
- Props: `name`, `label`, `value`, `onChange`, `error`

#### ReportFormModal.jsx

- Modal form để tạo/sửa báo cáo
- Props: `isOpen`, `onClose`, `initialData`, `onSubmit`, `mode`
- Chế độ: `create` (mới) hoặc `edit` (chỉnh sửa)
- Gọi API: POST `/api/reports` (create) hoặc PUT `/api/reports/:id` (edit)
- Hiển thị lỗi/thành công
- Đóng bằng ESC hoặc nút Đóng

#### ReportViewModal.jsx

- Modal xem chi tiết (chỉ đọc) cho báo cáo đã ra xưởng
- Props: `viewRecord`, `onClose`
- Hiển thị tất cả trường dưới dạng label-value
- Đóng bằng ESC hoặc nút Đóng
- Field mapping: `hoTen_ThuocCtyDonVi`, `loaiPhuongTien_BSX_BKSRomooc`, `soCont_SoSeal`

#### ReportDatePicker.jsx

- Chọn ngày báo cáo
- Props: `date`, `onChange`
- Nút chuyển ngày trước/sau (ChevronLeft/ChevronRight)
- Input type="date"
- Hiển thị ngày dạng DD/MM/YYYY

#### ReportTabs.jsx

- Tabs chuyển đổi giữa **Đã ra xưởng** và **Chưa ra xưởng**
- Props: `activeTab`, `onTabChange`, `pendingCount`, `completedCount`
- Hiển thị số lượng báo cáo ở mỗi tab

#### ReportCard.jsx

- Card hiển thị thông tin báo cáo
- Props: `record`, `onEdit`, `onView`
- Hiển thị: STT, họ tên/công ty, số thẻ, xưởng giao/nhận, giờ vào/ra
- Cảnh báo thiếu dữ liệu (highlight màu vàng)
- Nút Chỉnh sửa trên card pending (hiện khi hover)

#### CreateReportButton.jsx

- Nút "Tạo báo cáo mới"
- Gọi `openAIReportGenerator()` khi click (mở luồng AI)
- Style: crimson background, Plus icon

### ai/

#### CameraCapture.jsx

- Màn hình chụp ảnh trực tiếp (getUserMedia, camera sau ưu tiên)
- Vẽ watermark ngay tại thời điểm chụp (timestamp + tên cty + địa điểm + GPS)
- Upload ảnh từ thư viện (input file, accept="image/*", capture="environment")
- Preview/xóa ảnh, tối đa 10 ảnh
- Input nhập địa điểm, hiển thị trạng thái GPS
- Props: `onCapture(images)`, `onClose`

#### AIReportGenerator.jsx

- Modal chính cho luồng AI Report Generator
- Bước 1: CameraCapture (chụp ảnh + watermark)
- Bước 2: Loading (gọi `generateReportFromImages`)
- Bước 3: ReportResultBox (hiển thị kết quả)
- Bước 4: "Điền vào form" → `setInitForm(record)` + `openReportForm()`
- Export: `openAIReportGenerator()`, `OPEN_AI_REPORT_GENERATOR_EVENT`

#### ReportResultBox.jsx

- Hiển thị report text (giữ nguyên)
- Danh sách `found`/`missing` fields
- Danh sách `warnings` (nếu có)
- Nút "Điền vào form báo cáo", "Chụp lại", "Đóng"
- Props: `result`, `onFillForm`, `onRetake`, `onClose`

#### index.js

Export tất cả components:

```js
export { default as ReportForm } from "./ReportForm";
export { default as ReportField } from "./ReportField";
export { default as CreateReportButton } from "./CreateReportButton";
export { default as ReportFormModal } from "./ReportFormModal";
export { default as ReportViewModal } from "./ReportViewModal";
export { default as ReportDatePicker } from "./ReportDatePicker";
export { default as ReportTabs } from "./ReportTabs";
export { default as ReportCard } from "./ReportCard";
```

> **Lưu ý:** `ReportChat.jsx` (luồng dán text cũ) đã bị xóa trong Phase 2 — chỉ còn luồng AI.

### ui/

#### button.jsx

Custom Button component:

- Variants: `default` (blue), `outline` (border), `ghost` (transparent), `destructive` (red)
- Sizes: `sm` (h-8), `default` (h-10), `lg` (h-12), `icon` (w-10 h-10)
- Props: `className`, `variant`, `size`, `children`, ...rest
- Tự động merge className

---

## Public Assets

### manifest.json

PWA manifest:

- Name: "Quick Report App"
- Short name: "QuickReport"
- Icon: 192x192
- Display: standalone
- Theme color: #000000
- Background color: #ffffff

### service-workers.js

Service worker cơ bản (chỉ là comment "load a watcher").

### assets/

- `icons/` — PWA icons
- `images/` — Hình ảnh (chưa sử dụng trong luồng báo cáo mới)

---

## Environment Variables

```env
VITE_API_URL=http://localhost:3000
VITE_API_BASE_URL=https://quick-report-api.onrender.com
```

---

## Build & Deploy

### Development

```bash
cd clients
npm install
npm run dev
# Server chạy tại http://localhost:3001
```

### Production Build

```bash
npm run build
# Output: clients/dist/
```

### Deploy (Vercel)

- Build command: `npm run build`
- Output directory: `dist`
- API proxy: `/api/((?!general).*)` → Render API

---

*File này được cập nhật tự động — QuickReportApp Clients Context*

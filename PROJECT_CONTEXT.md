# QuickReportApp — Bối cảnh dự án

## Mục tiêu

QuickReportApp giúp nhân viên bảo vệ chuyển nội dung báo cáo logistics thô (ví dụ sao chép từ Zalo) thành báo cáo chuẩn và file Excel cuối ngày.

Luồng mục tiêu mới:

```text
Chọn ngày báo cáo
  → dán/gõ báo cáo thô
  → quét văn bản
  → xác nhận/chỉnh sửa trên modal
  → lưu báo cáo
  → theo dõi tại hai tab Đã ra xưởng / Chưa ra xưởng
  → xuất Excel khi cần hoặc tự động lúc 00:00 ngày hôm sau
```

## Quy tắc nghiệp vụ đã chốt

- `reportDate` là ngày do người dùng chọn lúc tạo báo cáo; không lấy lại ngày hệ thống khi xuất Excel.
- Khi nhấn **Thêm/Lưu**:
  - `gioRa` trống → trạng thái `pending`, hiển thị tại tab **Chưa ra xưởng**.
  - `gioRa` hợp lệ → trạng thái `completed`, hiển thị tại tab **Đã ra xưởng**.
- Báo cáo `pending` được phép thiếu một số thông tin để có thể bổ sung sau.
- Báo cáo chỉ được coi là hoàn tất khi đạt bộ điều kiện kiểm tra cho trạng thái `completed`.
- Chỉnh sửa báo cáo `pending` và điền `gioRa` hợp lệ sẽ tự chuyển báo cáo sang **Đã ra xưởng**.
- Excel xuất theo ngày đang chọn, tên file: `Báo cáo ddMMyyyyHHmmss.xlsx`.
- File xuất gồm tất cả báo cáo của ngày đó; cần chốt sau về một hay hai worksheet cho hai trạng thái.
- Thống nhất dùng thuật ngữ **xưởng** trên toàn bộ giao diện, không dùng lẫn với “cổng”.

## Hiện trạng mã nguồn

Repository có hai frontend song song:

1. `public/` + `app.js`: frontend vanilla JavaScript cũ, Express phục vụ trực tiếp.
2. `clients/`: React + Vite + Tailwind, là frontend cần được chọn làm bản chính.

Không phát triển thêm đồng thời hai frontend. Khi React đạt đủ luồng mới, cần ngừng/loại bỏ frontend legacy để tránh parser, form và API bị sai lệch.

Những phần đang có:

- `configs/record-schema.js`: nguồn dữ liệu chung cho tên trường, nhãn, alias, chuẩn hóa và mapping Excel. Phải tiếp tục là nguồn duy nhất.
- Parser React đã có thể quét văn bản và mở form đã điền sẵn.
- `ReportFormModal.jsx` hiện vẫn gửi yêu cầu tạo/tải Excel ngay sau khi submit. Đây là luồng cũ, cần đổi thành lưu báo cáo.
- `storage/data/quick-report.db` đã tồn tại nhưng cần lớp truy cập SQLite, migration và schema bảng chính thức.
- `services/excel-export.js` chưa hoàn thiện; chỉ triển khai sau khi dữ liệu đã được lưu và có thể đọc theo ngày.

## Kiến trúc theo giai đoạn

### Giai đoạn 1 — Chạy trên một máy

```text
React frontend → Express API → SQLite
                           └→ dịch vụ tạo Excel → thư mục exports/
```

- SQLite là nơi lưu bền vững các báo cáo.
- Máy vận hành có thể xuất thủ công.
- Nếu làm tự động trong giai đoạn này, app phải có cơ chế xuất bù khi máy không hoạt động tại 00:00.

### Giai đoạn 2 — Cloud nhẹ

```text
Frontend → Backend trên Render → Supabase PostgreSQL
                        └──────→ Supabase Storage (file Excel)

Render Cron Job (00:00 Asia/Ho_Chi_Minh) → tác vụ xuất Excel
```

- Không đưa file SQLite trực tiếp lên cloud để nhiều máy cùng dùng.
- Thiết kế Repository từ đầu để có thể thay SQLite bằng Supabase PostgreSQL mà không ảnh hưởng UI và nghiệp vụ.
- Render Cron Job phải chống chạy trùng; bảng lịch sử xuất là bắt buộc.
- Khi vận hành thật, ưu tiên gói Supabase không tự pause để tác vụ đêm đáng tin cậy.

## Module cần triển khai theo ưu tiên

1. `report-status`: quy tắc phân loại `pending`/`completed` dựa trên giờ ra hợp lệ.
2. `report-validation`: hai mức kiểm tra, lưu tạm và hoàn tất.
3. Persistence: migration, schema và `sqlite-report-repository`.
4. `report-service` và API tạo, lấy theo ngày, sửa, lấy chi tiết báo cáo.
5. State ngày báo cáo trên frontend.
6. Sửa `ReportFormModal`: đổi **Xuất Excel** thành **Thêm/Lưu**, gọi API lưu dữ liệu.
7. `ReportTabs`, `ReportCard` và luồng chỉnh sửa/chuyển trạng thái.
8. `excel-export`: tạo một workbook từ toàn bộ báo cáo của một ngày.
9. `export-run-service` và bảng `export_runs` để theo dõi/chống xuất trùng.
10. Adapter Supabase, Supabase Storage và Render Cron Job.
11. Cấu hình môi trường, logging và test.

## Cấu trúc module đề xuất

```text
services/
  report-service.js
  report-status.js
  report-validation.js
  report-repository.js
  excel-export.js
  export-run-service.js
  storage-service.js

database/
  migrations/
  sqlite-report-repository.js
  supabase-report-repository.js

clients/src/features/report/
  report-api.js
  report-store.js
  report-status.js

clients/src/components/report/
  ReportDatePicker.jsx
  ReportTabs.jsx
  ReportCard.jsx
```

## Nguyên tắc kỹ thuật

- Không nhân bản parser, nhãn hoặc schema ở nhiều nơi.
- Không hard-code API URL hoặc khóa dịch vụ; dùng biến môi trường.
- UI không chứa logic nghiệp vụ; phân loại/validation nằm ở `services/` và schema dùng chung.
- API xuất Excel phải đọc dữ liệu đã lưu, không nhận một báo cáo đơn lẻ rồi lập tức tải file.
- Tác vụ tự động phải idempotent: chạy lại không tạo thêm file tự động cho cùng ngày nếu đã thành công.

## Nguyên Tắc khi codex đọc file:

- Đọc và chạy file 'tree.ps1' để lấy câu trúc thư mục.
- Lưu lại và ghi nhớ cho lần sau

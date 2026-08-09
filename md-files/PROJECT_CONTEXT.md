# QuickReportApp — Project Context

> Cập nhật lần cuối: 2026-08-08
> Trạng thái: đang phát triển và hoạt động theo luồng báo cáo thực tế

## Mục tiêu

QuickReportApp giúp người dùng chuyển báo cáo logistics thô (từ ảnh, văn bản hoặc dữ liệu nhập tay) thành báo cáo có cấu trúc, lưu vào database và xuất Excel khi cần.

Luồng hiện tại:

```text
Đăng nhập
  → tạo hoặc chỉnh sửa báo cáo
  → có thể dùng AI để đọc ảnh và đề xuất dữ liệu
  → lưu báo cáo với trạng thái pending/completed
  → xem theo ngày và theo tab trạng thái
  → xuất Excel theo ngày
```

## Quy tắc nghiệp vụ hiện tại

- `reportDate` là ngày do người dùng chọn khi tạo báo cáo.
- Nếu `gioRa` trống hoặc không hợp lệ thì báo cáo ở trạng thái `pending`.
- Nếu `gioRa` hợp lệ thì báo cáo ở trạng thái `completed`.
- Báo cáo pending có thể được bổ sung sau.
- Khi chỉnh sửa báo cáo và điền `gioRa` hợp lệ, trạng thái sẽ tự chuyển sang completed.
- Export Excel dùng dữ liệu đã lưu trong database, không phụ thuộc vào dữ liệu đang mở trong modal.
- Hệ thống có auto-fill xưởng theo team của người dùng:
  - import → `xuongNhan`
  - export → `xuongGiao`

## Kiến trúc hiện tại

```text
React frontend (clients/) → Express API (app.js) → PostgreSQL via Prisma
                                             └→ Excel export service
                                             └→ AI generation service (Gemini/OpenRouter)
```

## Thành phần chính

- Frontend: React 19 + Vite 8 + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL + Prisma
- Excel: ExcelJS
- Auth: JWT + bcryptjs
- AI: Gemini/OpenRouter multimodal generation

## Trạng thái mã nguồn

Các module chính hiện đã được kết nối và hoạt động trong luồng hiện tại:

- [configs/record-schema.js](../configs/record-schema.js): schema chung cho field names, labels, aliases và mapping Excel.
- [services/report-service.js](../services/report-service.js): tạo, lấy, cập nhật và phân loại báo cáo.
- [services/excel-export.js](../services/excel-export.js): tạo workbook Excel và ghi lịch sử export.
- [services/auth-service.js](../services/auth-service.js): login và xác thực người dùng.
- [server/ai/ai.service.js](../server/ai/ai.service.js): gọi AI để sinh dữ liệu báo cáo từ ảnh hoặc văn bản.
- [clients/src/components/ai/AIReportGenerator.jsx](../clients/src/components/ai/AIReportGenerator.jsx): luồng AI trên frontend.

## Tình trạng triển khai

### Hoàn thành

- Prisma schema cho User, Report, ExportRun
- CRUD báo cáo và trạng thái pending/completed
- Export Excel theo ngày
- Lịch sử export và chống trùng cho export tự động
- Luồng AI tạo báo cáo từ ảnh
- UI báo cáo và modal chỉnh sửa

### Còn cần làm tiếp

- Hoàn thiện test end-to-end cho các luồng chính
- Tăng cường logging và error handling production
- Chuẩn hóa deployment và environment variables cho môi trường thật
- Có thể thêm scheduler/cron nếu cần export tự động ở môi trường deploy

## Nguyên tắc phát triển

- Không tạo schema riêng ở nhiều chỗ; dùng chung file cấu hình và schema.
- Logic nghiệp vụ nên nằm ở service layer, không nên lẫn trong UI.
- API nên đọc dữ liệu từ database thay vì phụ thuộc vào state frontend.
- AI chỉ nên đóng vai trò đề xuất; người dùng vẫn review và lưu lại kết quả.

## API chính

- POST /api/auth/login
- GET /api/auth/me
- GET /api/users
- POST /api/reports
- GET /api/reports
- GET /api/reports/:id
- PUT /api/reports/:id
- GET /api/reports/export/:date
- GET /api/reports/export/history

## AI workflow

```text
Người dùng chụp ảnh hoặc cung cấp text
  → backend gọi AI service
  → parser ánh xạ kết quả về record schema
  → người dùng xem và chỉnh sửa trước khi lưu
```

## Ghi chú

Tài liệu này đã được điều chỉnh để phản ánh kiến trúc hiện tại thay vì các kế hoạch cũ về SQLite, Telegram bot riêng hoặc phase P8 cũ.


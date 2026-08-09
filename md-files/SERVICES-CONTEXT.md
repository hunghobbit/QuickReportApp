# SERVICES-CONTEXT — Service Layer

> Cập nhật lần cuối: 2026-08-08
> Phạm vi: services/

## Tổng quan

Service layer hiện tại chứa logic nghiệp vụ chính của hệ thống: auth, validation, status rule, report lifecycle và Excel export.

## Các service hiện có

- services/auth-service.js: login, verifyToken, getUsers, createUser
- services/report-service.js: tạo, đọc, cập nhật báo cáo; tự động detect reportType và auto-fill xưởng
- services/record-validation.js: kiểm tra payload theo draft/complete mode
- services/report-status.js: phân loại pending/completed dựa trên gioRa
- services/excel-export.js: tạo file Excel và ghi export history

## Logic nghiệp vụ hiện tại

### Report service

- Validate payload trước khi lưu
- Tự động phát hiện loại report từ rawText
- Auto-fill xưởng theo team của user
- Tính lại status sau khi cập nhật gioRa

### Validation

- Draft mode cho phép gioRa trống
- Complete mode yêu cầu gioRa hợp lệ
- Dữ liệu được chuẩn hóa trước khi lưu

### Excel export

- Xuất 2 sheet: Chưa ra xưởng và Đã ra xưởng
- Ghi file vào storage/reports
- Ghi bản ghi export_runs vào database
- Chặn duplicate automatic export

## Ghi chú triển khai

- Report service hiện đang dùng Prisma repositories thay vì các repository SQLite cũ.
- Các service có thể được test riêng rẽ bằng Vitest.

---

*File này được cập nhật tự động — QuickReportApp Services Context*

```bash
cd clients
npm test
# hoặc
npx vitest run services/report-status.test.js
```

---


---

## AI Service (server/ai/)

### Mục đích

AI Report Generator Service sử dụng Google Gemini 2.5 Flash để tạo báo cáo giám sát từ ảnh chụp hoặc text OCR.

### Hàm chính

#### `generateReport({ userInput, ocr })` — Text-only mode
- **Input**: `{ userInput: { companyName, transportCompany }, ocr: { idCard, licensePlate, container, seal, invoice, goods } }`
- **Output**: `{ success, data: { report, fields, found, missing, warnings } }`
- **Logic**: Build structured JSON → gửi text cho Gemini → parse + validate output

#### `generateReportFromImages({ userInput, images })` — Multimodal mode ⭐ NEW
- **Input**: `{ userInput: { companyName, transportCompany }, images: [{ data, mimeType }] }`
- **Output**: `{ success, data: { report, fields, found, missing, warnings, record } }`
- **Logic**: Build text + ảnh base64 → gửi multimodal cho Gemini → parse + validate output
- **Ưu điểm**: AI tự OCR + generate trong 1 bước, chính xác hơn

#### `isAIConfigured()`
- Trả về `boolean` — kiểm tra GEMINI_API_KEY

### Configuration
- **Model**: `gemini-2.5-flash` (override bằng `AI_MODEL` env var)
- **Temperature**: 0.1
- **Max tokens**: 1024 (text), 2048 (multimodal)

### Dependencies
- `@google/genai` ^2.13.0
- `multer` ^2.2.0 (cho image upload)
- Environment: `GEMINI_API_KEY`, `AI_MODEL`

### Chi tiết: xem `md-files/AI-CONTEXT.md`

*File này được cập nhật tự động — QuickReportApp Services Context*

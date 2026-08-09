# FILE-CONTEXT — File Context Index

> **Cập nhật lần cuối:** 08/08/2026
> **Phạm vi:** Toàn bộ dự án QuickReportApp

---

## Tổng quan

File này là chỉ mục (index) cho tất cả các file context trong dự án. Mỗi thư mục lớn có một file context riêng để dễ quản lý và tra cứu.

## Cấu trúc file context

```text
md-files/
├── FILE-CONTEXT.md           # File này — chỉ mục tổng quan
├── PROJECT_CONTEXT.md        # Bối cảnh dự án, kiến trúc, quy tắc nghiệp vụ
├── TODO.md                   # Danh sách việc cần ưu tiên hiện tại
├── processing.md             # Quy trình phát triển và ghi chú lịch sử
│
├── CLIENTS-CONTEXT.md        # Frontend React/Vite (clients/)
├── SERVICES-CONTEXT.md       # Service layer (services/)
├── DATABASE-CONTEXT.md       # Database layer (database/ + prisma/)
├── CONFIGS-CONTEXT.md        # Configuration files (configs/ + root configs)
├── SERVER-CONTEXT.md         # Express server và các route API chính (app.js + server/)
├── MIDDLEWARE-CONTEXT.md     # Middleware (middleware/)
├── MODULES-CONTEXT.md        # Modules (modules/)
├── AI-CONTEXT.md             # AI Report Generator (server/ai/)
│
├── P7-IMPLEMENTATION.md      # P7 Export history implementation
└── Fixed-cracked-errors.md   # Error fixes log
```

## File context theo thư mục

| Thư mục | File context | Mô tả |
|----------|-------------|-------|
| `clients/` | `CLIENTS-CONTEXT.md` | Frontend React 19 + Vite 8, components, contexts, utils, features |
| `services/` | `SERVICES-CONTEXT.md` | Service layer: auth, excel-export, record-validation, report-service, report-status |
| `database/` + `prisma/` | `DATABASE-CONTEXT.md` | Database layer: Prisma schema, repositories, migration, seed |
| `configs/` + root configs | `CONFIGS-CONTEXT.md` | Configuration: record-schema, worksheet-config, package.json, vite, tailwind, etc. |
| `app.js` + `server/` | `SERVER-CONTEXT.md` | Express server API endpoints, Telegram bot |
| `middleware/` | `MIDDLEWARE-CONTEXT.md` | Auth middleware: requireAuth, optionalAuth |
| `modules/` | `MODULES-CONTEXT.md` | Utility functions |
| `server/ai/` | `AI-CONTEXT.md` | AI Report Generator: prompt, buildInput, ai.service, report-parser, validator |

## Các file context khác

| File | Mô tả |
|------|-------|
| `PROJECT_CONTEXT.md` | Bối cảnh dự án: mục tiêu, kiến trúc, quy tắc nghiệp vụ, trạng thái triển khai |
| `TODO.md` | Danh sách công việc ưu tiên và mục tiêu hiện tại |
| `processing.md` | Quy trình phát triển, các bước đã thực hiện, phân tích module |
| `AI-CONTEXT.md` | AI Report Generator: prompt, buildInput, ai.service, report-parser, validator |
| `P7-IMPLEMENTATION.md` | Chi tiết implementation P7: export history, duplicate prevention |
| `Fixed-cracked-errors.md` | Lịch sử các lỗi đã sửa |

## Các file Markdown gốc (không thuộc md-files/)

| File | Mô tả |
|------|-------|
| `README.md` | Hướng dẫn dự án, API endpoints, deployment |
| `DATABASE-SETUP.md` | Hướng dẫn thiết lập database, multi-user system |
| `DEPLOYMENT.md` | Hướng dẫn deploy lên Render |
| `MULTI-USER-IMPLEMENTATION.md` | Chi tiết implementation multi-user |

## Tổng quan dự án

### Công nghệ

| Layer | Công nghệ |
|-------|-----------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 |
| Backend | Node.js + Express.js |
| Database | PostgreSQL 16 + Prisma 7 |
| Excel | ExcelJS |
| Auth | JWT + bcryptjs |
| Validation | Joi |
| Icons | Lucide React |
| Deploy | Render (API) + Vercel (Frontend) |

### Kiến trúc

```text
React frontend (clients/) → Express API (app.js) → PostgreSQL via Prisma
                                             └→ Excel export service
                                             └→ AI generation service (Gemini/OpenRouter)
```

### API Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/auth/me` | Thông tin user |
| GET | `/api/users` | Danh sách users |
| POST | `/api/reports` | Tạo báo cáo |
| GET | `/api/reports?date=YYYY-MM-DD` | Danh sách báo cáo |
| GET | `/api/reports/:id` | Chi tiết báo cáo |
| PUT | `/api/reports/:id` | Cập nhật báo cáo |
| GET | `/api/reports/export/:date` | Xuất Excel |
| GET | `/api/reports/export/history/:date` | Lịch sử xuất |
| GET | `/api/reports/export/history` | Lịch sử xuất (range) |

### Database Models

- **User**: id, name, password, team, createdAt, updatedAt
- **Report**: id, businessId, stt, hoTen, ..., gioVao, gioRa, status, reportDate, ...
- **ExportRun**: id, date, filePath, fileName, recordCount, status, createdAt

### Trạng thái phát triển

| Mục tiêu | Trạng thái | Mô tả |
|---------|-----------|-------|
| Core reporting workflow | ✅ Hoạt động | CRUD báo cáo, trạng thái pending/completed, export Excel |
| AI-assisted report generation | ✅ Hoạt động | Chụp ảnh và sinh báo cáo từ AI |
| Hardening & testing | 🔄 Đang làm | Cải thiện error handling, logging và test end-to-end |
| Deployment readiness | ⏳ Chờ tiếp | Chuẩn hóa environment và deploy thực tế |

---

*File này được cập nhật tự động — QuickReportApp File Context Index*

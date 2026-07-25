# FILE-CONTEXT.md — QuickReportApp Project Context

*(Được tạo từ kết quả đọc file ngày 2026-07-25)*

---

## 1. Tổng quan dự án

**QuickReportApp** — Ứng dụng giúp nhân viên bảo vệ chuyển nội dung báo cáo logistics thô (sao chép từ Zalo) thành báo cáo chuẩn và file Excel cuối ngày.

### Kiến trúc (Giai đoạn hiện tại)

```
React frontend (clients/) → Express API (app.js) → PostgreSQL (Prisma 7)
                                               └→ Excel export service → file .xlsx
```

**Lưu ý quan trọng**: Dự án đã chuyển từ SQLite sang PostgreSQL (Prisma 7) theo yêu cầu P8. Tuy nhiên, vẫn còn file migration SQLite cũ (`database/migrations/001-create-reports-table.sql`, `002-create-export-runs-table.sql`) và các file liên quan đến SQLite (`database/db.js`, `database/sqlite-report-repository.js`, `database/export-run-repository.js`) chưa được xóa.

### Module cần triển khai theo ưu tiên

1. (P1) `report-status` ✅ — đã hoàn thành
2. (P1) `record-validation` ✅ — đã hoàn thành (hỗ trợ 2 mode draft/complete)
3. (P2) Persistence: migration, schema và `prisma-report-repository` ✅ — đã hoàn thành
4. (P3) `report-service` và API ✅ — đã hoàn thành
5. (P4) State ngày báo cáo frontend, sửa `ReportFormModal` ✅ — đã hoàn thành
6. (P5) `ReportTabs`, `ReportCard` và luồng chỉnh sửa/chuyển trạng thái ✅ — đã hoàn thành
7. (P6) Excel export từ database ✅ — đã hoàn thành
8. (P7) Lịch sử xuất, chống xuất trùng ✅ — đã hoàn thành
9. (P8) Chuyển cloud: Supabase + Render 🔄 — ĐÃ BẮT ĐẦU (đã chuyển sang PostgreSQL)
10. (P9) Chất lượng, logging, test

---

## 2. Cấu trúc thư mục hiện tại

```
QuickReportApp/
├── app.js                             # Express server (API endpoints)
├── package.json                       # type: module, dependencies + devDependencies
├── prisma.config.js                   # Prisma 7 datasource config
├── prisma/
│   └── schema.prisma                  # Prisma schema (User, Report, ExportRun)
├── configs/
│   ├── record-schema.js               # Schema gốc: labels, groups, excelColumnMap, payloadFields, validators...
│   └── worksheet-config.js            # START_ROW=3, COL_LIMIT=13, ROW_LIMIT=150
├── database/
│   ├── prisma-client.js               # Prisma singleton client (PostgreSQL)
│   ├── prisma-report-repository.js    # Repository: CRUD reports với Prisma
│   ├── prisma-export-run-repository.js # Repository: CRUD export_runs với Prisma
│   ├── migrate.js                     # Migration runner (Prisma db push + generate)
│   └── migrations/                    # SQLite migrations (cũ, có thể xóa)
│       ├── 001-create-reports-table.sql
│       └── 002-create-export-runs-table.sql
├── services/
│   ├── report-status.js               # getReportStatus, isReportCompleted, isReportPending
│   ├── report-status.test.js          # Unit tests cho report-status + validateRecordPayload
│   ├── record-validation.js           # validateRecordPayload (2 mode) + validateRequestPayload
│   ├── report-service.js              # Service layer: create, get, update reports
│   ├── excel-export.js                # exportDayReport: xuất toàn bộ báo cáo 1 ngày
│   └── auth-service.js                # Login, verify token, create user (bcrypt + JWT)
├── middleware/
│   └── auth.js                        # requireAuth, optionalAuth (JWT middleware)
├── modules/
│   └── utils.js                       # buildTempRecordFromSupplementaryValues, getEmptyFields
├── clients/                           # React + Vite + Tailwind (frontend chính)
│   ├── src/
│   │   ├── App.jsx                    # Root component
│   │   ├── main.jsx                   # Entry point
│   │   ├── index.css                  # Global styles
│   │   ├── globals.css                # Tailwind + theme variables
│   │   ├── config/
│   │   │   ├── record-schema.js       # Re-export từ ../../configs/record-schema.js
│   │   │   ├── aliases.js             # Re-export RECORD_SCHEMA.labels và textAliases
│   │   │   └── worksheet-config.js    # Re-export từ ../../configs/worksheet-config.js
│   │   ├── utils/
│   │   │   ├── api.js                 # API calls (createReport, getReportsByDate, exportExcel)
│   │   │   ├── date.js                # formatDate, today, displayDate
│   │   │   └── helper.js              # checkIsValid
│   │   ├── contexts/
│   │   │   └── ExportContext.jsx      # State: initForm, reportDate
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── DesktopTopNav.jsx
│   │   │   │   └── MobileBottomNav.jsx
│   │   │   ├── report/
│   │   │   │   ├── ReportFormModal.jsx  # Modal tạo/chỉnh sửa báo cáo
│   │   │   │   ├── ReportViewModal.jsx  # Modal xem chi tiết (chỉ đọc)
│   │   │   │   ├── ReportTabs.jsx       # Tabs: Chưa ra xưởng / Đã ra xưởng
│   │   │   │   ├── ReportCard.jsx       # Card hiển thị báo cáo
│   │   │   │   ├── ReportForm.jsx       # Form fields
│   │   │   │   ├── ReportField.jsx      # Input/textarea field
│   │   │   │   ├── ReportChat.jsx       # Modal quét văn bản
│   │   │   │   ├── ReportDatePicker.jsx # Date picker với prev/next buttons
│   │   │   │   ├── CreateReportButton.jsx # Nút "Tạo báo cáo mới"
│   │   │   │   └── index.js             # Barrel export
│   │   │   └── ui/
│   │   │       └── button.jsx           # Button component
│   │   └── features/
│   │       └── report/
│   │           ├── parser.js            # parseReportText, getFieldValueFromLine
│   │           └── validator.js         # Joi validation (draft/complete)
│   └── package.json
├── storage/
│   ├── data/                      # (SQLite database file - có thể xóa)
│   └── reports/                   # Generated Excel files
├── templates/
│   └── Goods_Template.xlsx        # Excel template
├── md-files/                      # Documentation
│   ├── PROJECT_CONTEXT.md
│   ├── P7-IMPLEMENTATION.md
│   ├── Fixed-cracked-errors.md
│   ├── FILE-CONTEXT.md
│   └── processing.md
├── .env                           # Environment variables (không commit)
├── .env.example                   # Template environment variables
├── render.yaml                    # Render deployment config
├── package.json                   # Backend dependencies
└── README.md                      # Project documentation
```

---

## 3. Chi tiết từng file

### 3.1. `app.js` — Express Server

- **Vai trò**: Entry point của backend, chạy Express trên port 3000.
- **Middleware**: `cors()`, `express.json()`, `morgan("combined")`.
- **API Endpoints**:
  - `POST /api/auth/login` — Đăng nhập, trả về JWT token
  - `GET /api/auth/me` — Lấy thông tin user hiện tại (requireAuth)
  - `GET /api/users` — Danh sách users (requireAuth)
  - `POST /api/reports` — Tạo báo cáo mới (draft mode, optionalAuth)
  - `GET /api/reports?date=YYYY-MM-DD` — Danh sách báo cáo theo ngày
  - `GET /api/reports/export/:date` — Xuất Excel báo cáo theo ngày
  - `GET /api/reports/:id` — Chi tiết báo cáo
  - `PUT /api/reports/:id` — Cập nhật báo cáo (optionalAuth)
  - `GET /api/reports/export/history/:date` — Lịch sử xuất theo ngày
  - `GET /api/reports/export/history?startDate=...&endDate=...` — Lịch sử xuất theo khoảng ngày
- **Database**: Prisma 7 với PostgreSQL (không còn SQLite)
- **Graceful shutdown**: Xử lý SIGINT và SIGTERM để disconnect Prisma

### 3.2. `services/report-status.js`

- **Trạng thái báo cáo**: `pending` (chưa ra xưởng) | `completed` (đã ra xưởng).
- **Luật**: `gioRa` rỗng/không hợp lệ → `pending`; `gioRa` hợp lệ (HH:MM) → `completed`.
- **Hàm**:
  - `getReportStatus(record)` — Dùng `normalizeTime` + regex `/^\d{2}:\d{2}$/` để xác định status.
  - `isReportCompleted(record)` / `isReportPending(record)` — Helper boolean.

### 3.3. `services/report-status.test.js`

- Unit tests cho `normalizeTime`, `getReportStatus`, `isReportCompleted`, `isReportPending`, `validateRecordPayload`.
- Dùng `vitest`.
- Test cả draft mode và complete mode cho `validateRecordPayload`.

### 3.4. `services/record-validation.js`

- **Hai mode validation:**
  - `draft` mode: Không yêu cầu `gioRa`, cho phép lưu tạm (pending).
  - `complete` mode (default): Yêu cầu đầy đủ tất cả required fields bao gồm `gioRa`.
- **`validateRequestPayload(rawBody, mode)`**: Hàm wrapper dùng cho Express endpoint cũ, hỗ trợ cả `rawBody` trực tiếp và `rawBody.tempRecord` (từ form multipart).
- **Quy trình validation**:
  1. Parse JSON nếu payload là string.
  2. `normalizeRecordInput()` chuẩn hóa dữ liệu.
  3. Sanitize tất cả string fields.
  4. Kiểm tra `stt` là số.
  5. Kiểm tra `gioVao` phải hợp lệ (luôn bắt buộc).
  6. Nếu mode=complete, kiểm tra `gioRa` hợp lệ.
  7. Kiểm tra required fields theo mode.
  8. Xây dựng record object và tính status.
- **Trả về**: `{ ok, record?, status?, error? }`

### 3.5. `services/report-service.js`

- **Vai trò**: Service layer trung gian giữa API handlers và Repository.
- **Import**: `validateRecordPayload` (record-validation), `getReportStatus` (report-status), `sanitizeText`, `normalizeTime` (record-schema), toàn bộ `prisma-report-repository`.
- **`ALLOWED_UPDATE_FIELDS`**: Mảng 14 field được phép cập nhật (stt, hoTen_ThuocCtyDonVi, ..., rawText). Không bao gồm id, status, createdAt, updatedAt.
- **`extractPayload(body)`**: Hỗ trợ cả body trực tiếp và body chứa `tempRecord`.
- **`createReport(body, mode)`**:
  - Kiểm tra `reportDate` bắt buộc, format YYYY-MM-DD.
  - Gọi `validateRecordPayload(payload, effectiveMode)`.
  - Build report object với `reportDate`, `rawText`, `businessId` (từ `payload.id`), `status`.
  - Gọi `repo.createReport(report)`.
  - Trả về `{ success, data?, error? }`.
- **`getReportsByDate(reportDate)`**: Kiểm tra tham số, gọi `repo.getReportsByDate`.
- **`getReportById(id)`**: Gọi `repo.getReportById`, trả về `"Report not found."` nếu null.
- **`updateReport(id, body)`**:
  - Lấy existing report để kiểm tra tồn tại.
  - Lọc theo `ALLOWED_UPDATE_FIELDS`.
  - **Map field `id` (từ frontend form) → `businessId` (DB column `giayTo`)** để đảm bảo giá trị "Loại giấy tờ - Số giấy tờ" được lưu đúng.
  - Validate: `stt` phải numeric, `gioVao`/`gioRa` phải valid time hoặc empty.
  - Sanitize tất cả string fields.
  - Gọi `repo.updateReport(id, updates)` (tự tính lại status trong repository).
  - Trả về `"Report not found."` nếu null (404), lỗi khác (400).
- **`getReportsByStatus(reportDate, status)`**: Validate `status` phải là `'pending'` hoặc `'completed'`.
- **Logging**: `console.error` với prefix `[report-service]` trong tất cả catch blocks.
- **Export**: Named exports + default object export.

### 3.6. `services/excel-export.js` ✅ ĐÃ HOÀN THIỆN (P6)

- **Vai trò**: Xuất toàn bộ báo cáo của một ngày từ database thành file Excel.
- **`exportDayReport(reportDate, exportType = "manual")`**: Hàm chính xuất Excel.
  1. Kiểm tra chống xuất trùng (chỉ áp dụng cho automatic)
  2. Lấy danh sách báo cáo từ database theo ngày (`repo.getReportsByDate`).
  3. Phân loại `pending` / `completed`.
  4. Mở template `Goods_Template.xlsx`, đặt tên sheet đầu là "Chưa ra xưởng" (hoặc "Đã ra xưởng" nếu chỉ có 1 loại).
  5. Tìm dòng trống đầu tiên từ `START_ROW=3`, ghi dữ liệu từng bản ghi vào các cột theo `excelColumnMap`.
  6. Tạo sheet thứ hai "Đã ra xưởng" (copy cấu trúc header từ template) nếu có cả pending và completed.
  7. Thêm border cho tất cả dòng dữ liệu.
  8. Xuất file với tên `Báo cáo ddMMyyyyHHmmssSSS.xlsx` vào `storage/reports/`.
  9. Lưu lịch sử xuất vào `export_runs` với `export_type` và `status`.
- **FIELD_MAP**: Map `id` (tên cột trong excelColumnMap) → `businessId` (tên field trong record object), vì `id` là khóa chính Prisma.
- **`copySheetStructure()`**: Copy column widths, header rows (style, font, fill, alignment, border) từ template để tạo sheet thứ hai.
- **API**: `GET /api/reports/export/:date` — gọi `exportDayReport()`, trả file về client qua `res.download()`.

### 3.7. `services/auth-service.js`

- **Vai trò**: Xác thực người dùng với JWT.
- **`login(name, password)`**: Tìm user theo `name`, so sánh password hash với bcrypt, trả về JWT token.
- **`verifyToken(token)`**: Xác thực JWT token, trả về user info.
- **`getUsers()`**: Lấy danh sách tất cả users (chỉ id, name, team, createdAt).
- **`createUser({ name, team, password })`**: Tạo user mới với password hash.
- **JWT_SECRET**: Lấy từ `process.env.JWT_SECRET` hoặc default.
- **JWT_EXPIRES_IN**: Lấy từ `process.env.JWT_EXPIRES_IN` hoặc "7d".

### 3.8. `middleware/auth.js`

- **`requireAuth(req, res, next)`**: Yêu cầu Bearer token hợp lệ, gắn `req.user`.
- **`optionalAuth(req, res, next)`**: Nếu có token hợp lệ thì gắn `req.user`, không thì cho qua.

### 3.9. `database/prisma-client.js`

- **Singleton PrismaClient** với `@prisma/adapter-pg` (Prisma 7).
- **`getPrisma()`**: Lấy instance PrismaClient (singleton).
- **`disconnectPrisma()`**: Ngắt kết nối Prisma client (graceful shutdown).
- **Log**: `["query", "warn", "error"]` trong development, `["warn", "error"]` trong production.

### 3.10. `database/prisma-report-repository.js`

- **Repository cho Report model** sử dụng Prisma ORM.
- **Interface**:
  - `createReport(report)` — Insert, tự động tính status, trả về report mới (có id).
  - `getReportsByDate(reportDate)` — Lấy danh sách theo ngày (ORDER BY id ASC).
  - `getReportById(id)` — Lấy chi tiết 1 report.
  - `updateReport(id, updates)` — Merge với dữ liệu cũ, tự tính lại status từ `gioRa`, cập nhật `updatedAt`.
  - `deleteReport(id)` — Xóa, trả về boolean.
  - `getReportsByStatus(reportDate, status)` — Lọc theo ngày + trạng thái.
- **`mapPrismaReportToService(row)`**: Chuyển từ Prisma (snake_case) sang service format (camelCase), `giayTo` → `businessId`.
- **`mapServiceToPrisma(report)`**: Chuyển từ service (camelCase) sang Prisma fields, `businessId` → `giayTo`.

### 3.11. `database/prisma-export-run-repository.js`

- **Repository cho ExportRun model** sử dụng Prisma ORM.
- **Interface**:
  - `createExportRun(exportRun)` — Tạo bản ghi lịch sử xuất mới.
  - `hasSuccessfulExport(reportDate, exportType)` — Kiểm tra đã có lượt xuất thành công chưa.
  - `getExportRunsByDate(reportDate)` — Lấy lịch sử xuất theo ngày.
  - `getExportRunsByDateRange(startDate, endDate)` — Lấy lịch sử xuất theo khoảng ngày.
  - `getLatestExportRun(reportDate, exportType)` — Lấy lượt xuất gần nhất.
- **`mapPrismaExportRunToService(exportRun)`**: Chuyển từ Prisma sang service format.
- **`mapServiceToPrisma(data)`**: Chuyển từ service sang Prisma fields.

### 3.12. `database/migrate.js`

- **Script migration cho Prisma 7**.
- **Chức năng**:
  1. Đọc `DATABASE_URL` từ `.env` nếu chưa có trong environment.
  2. Chạy `npx prisma db push` để đồng bộ schema.
  3. Chạy `npx prisma generate` để tạo Prisma Client.
- **Lưu ý**: Prisma 7 dùng `prisma.config.js` thay vì config trong `schema.prisma`.

### 3.13. `configs/record-schema.js`

- **Nguồn dữ liệu duy nhất** cho tên trường, nhãn, alias, chuẩn hóa và mapping Excel.
- **`RECORD_SCHEMA`** object chứa:
  - `labels` — Nhãn tiếng Việt cho từng trường.
  - `groups` — Nhóm trường cho UI form.
  - `excelColumnMap` — Map field → column number (1-based).
  - `payloadFields` — 13 trường gửi lên API (dạng ghép).
  - `formFields` — 17 trường UI (dạng tách nhỏ).
  - `requiredPayloadFields` — 10 trường bắt buộc (bao gồm `gioRa`).
  - `aliases` — Bí danh field (vd: `id: ["cccd"]`).
  - `fieldTypes` — Kiểu dữ liệu từng trường (`number`, `string`, `time`).
  - `validators` — Hàm kiểm tra `stt` (numeric), `gioVao`, `gioRa` (valid time).
  - `textAliases` — Nhãn văn bản cho free-text parsing.
- **Hàm chính**: `normalizeTime()`, `sanitizeText()`, `normalizeRecordInput()`, `buildRecordPayload()`, `createInitialRecordForm()`.

### 3.14. `configs/worksheet-config.js`

- Cấu hình Excel: `START_ROW=3`, `COL_LIMIT=13`, `ROW_LIMIT=150`.

### 3.15. `modules/utils.js`

- `buildTempRecordFromSupplementaryValues(values)` — Xây dựng tempRecord từ form values (ghép các trường).
- `getEmptyFields(obj, fields)` — Kiểm tra field nào đang trống.

### 3.16. `prisma/schema.prisma`

- **Datasource**: PostgreSQL (qua `prisma.config.js`).
- **Models**:
  - `User`: id, name (unique), team, passwordHash, createdAt, updatedAt, reports[]
  - `Report`: id, reportDate, stt, hoTen_ThuocCtyDonVi, xuongGiao, xuongNhan, soThe, giayTo, loaiPhuongTien_BSX_BKSRomooc, soCont_SoSeal, chiTietHangHoa, soPhieu, gioVao, gioRa, ghiChu, rawText, status, reportType, userId, createdAt, updatedAt
  - `ExportRun`: id, reportDate, exportType, exportedAt, fileName, filePath, status, errorMessage, createdAt
- **Indexes**: reportDate, status trên Report; reportDate, exportType trên ExportRun.

### 3.17. `prisma.config.js`

- Prisma 7 configuration — chứa datasource config thay vì trong schema.prisma.
- URL lấy từ `process.env.DATABASE_URL` hoặc default `postgresql://localhost:5432/quickreport`.

---

## 4. Frontend Architecture

### 4.1. State Management

- **ExportContext** (`clients/src/contexts/ExportContext.jsx`):
  - `initForm`: Form values ban đầu (từ scanner hoặc empty)
  - `setInitForm`: Cập nhật form values
  - `reportDate`: Ngày báo cáo hiện hành (YYYY-MM-DD)
  - `setReportDate`: Cập nhật ngày báo cáo

### 4.2. API Layer

- **`clients/src/utils/api.js`**:
  - `API_BASE`: `/api` (development) hoặc `https://quick-report-api.onrender.com/api` (production)
  - `createReport(payload)`: POST /api/reports
  - `getReportsByDate(date)`: GET /api/reports?date=...
  - `getReportById(id)`: GET /api/reports/:id
  - `updateReport(id, updates)`: PUT /api/reports/:id
  - `exportExcel(date)`: GET /api/reports/export/:date (download file)

### 4.3. Components

- **ReportDatePicker**: Chọn ngày với prev/next buttons và date input.
- **ReportFormModal**: Modal tạo/chỉnh sửa báo cáo với form validation (Joi).
- **ReportViewModal**: Modal xem chi tiết báo cáo đã ra xưởng (chỉ đọc).
- **ReportTabs**: Tabs "Chưa ra xưởng" / "Đã ra xưởng", load data theo ngày.
- **ReportCard**: Hiển thị thông tin báo cáo dạng card, có nút "Chỉnh sửa" cho pending.
- **ReportChat**: Modal quét văn bản, parse text → fill form.
- **CreateReportButton**: Nút "Tạo báo cáo mới" (mở ReportChat).

### 4.4. Validation

- **Frontend**: Joi validation (`clients/src/features/report/validator.js`)
  - `reportDraftFormSchema`: Cho phép `gioRa` trống
  - `reportCompleteFormSchema`: Yêu cầu `gioRa` hợp lệ
- **Backend**: `validateRecordPayload()` trong `services/record-validation.js`

---

## 5. Database Schema (PostgreSQL/Prisma)

### 5.1. Bảng `reports`

```prisma
model Report {
  id                           Int       @id @default(autoincrement())
  reportDate                   String    // YYYY-MM-DD
  stt                          String    @default("")
  hoTen_ThuocCtyDonVi          String    @default("")
  xuongGiao                    String    @default("")
  xuongNhan                    String    @default("")
  soThe                        String    @default("")
  giayTo                       String    @default("")
  loaiPhuongTien_BSX_BKSRomooc String    @default("")
  soCont_SoSeal                String    @default("")
  chiTietHangHoa               String    @default("")
  soPhieu                      String    @default("")
  gioVao                       String    @default("")
  gioRa                        String    @default("")
  ghiChu                       String    @default("")
  rawText                      String    @default("")
  status                       String    @default("pending")
  reportType                   String?   // "import" | "export" | null
  userId                       Int?
  user                         User?     @relation(fields: [userId], references: [id])
  createdAt                    DateTime  @default(now())
  updatedAt                    DateTime  @updatedAt

  @@index([reportDate])
  @@index([status])
  @@map("reports")
}
```

### 5.2. Bảng `export_runs`

```prisma
model ExportRun {
  id           Int      @id @default(autoincrement())
  reportDate   String
  exportType   String   @default("manual")
  exportedAt   DateTime
  fileName     String
  filePath     String
  status       String   @default("success")
  errorMessage String?
  createdAt    DateTime @default(now())

  @@index([reportDate])
  @@index([exportType])
  @@map("export_runs")
}
```

### 5.3. Bảng `users`

```prisma
model User {
  id           Int       @id @default(autoincrement())
  name         String    @unique               // "Đội ELA" | "Đội DTA"
  team         String                          // "ELA" | "DTA"
  passwordHash String
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  reports      Report[]

  @@map("users")
}
```

---

## 6. Environment Variables

### 6.1. `.env` (Local Development)

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/quickreport"
TEMPLATE_DIR=templates
EXPORT_DIR=storage/reports
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
LOG_LEVEL=info
JWT_SECRET=quick-report-secret-key-change-in-production
JWT_EXPIRES_IN=7d
```

### 6.2. `render.yaml` (Production)

```yaml
services:
  - type: web
    name: quick-report-api
    runtime: node
    plan: free
    buildCommand: npm install && cd clients && npm install && npm run build && cd .. && npx prisma generate
    startCommand: node app.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        fromDatabase:
          name: quick-report-db
          property: connectionString
      - key: TEMPLATE_DIR
        value: /opt/render/project/src/templates
      - key: EXPORT_DIR
        value: /opt/render/project/src/storage/reports
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRES_IN
        value: 7d

databases:
  - name: quick-report-db
    plan: free
    databaseName: quickreport
    user: quickreport_user
```

---

## 7. Trạng thái triển khai

### 7.1. P0-P2: ✅ HOÀN THÀNH

- Schema, validation (2 mode), status rule, PostgreSQL + Prisma, repository CRUD.

### 7.2. P3: ✅ HOÀN THÀNH

- `report-service.js` + 4 API endpoints (POST/GET/GET/:id/PUT/:id).
- Endpoint cũ `/api/write-record` đã được thay thế hoàn toàn.

### 7.3. P4: ✅ HOÀN THÀNH

- `ReportDatePicker` + state ngày báo cáo.
- `ReportFormModal` đổi từ "Xuất Excel" → "Lưu báo cáo", gọi API mới.
- Modal quét giữ giá trị đã parse.

### 7.4. P5: ✅ HOÀN THÀNH

- `ReportTabs`, `ReportCard`, chỉnh sửa/chuyển trạng thái.
- Fix bug: form chỉnh sửa lấy nhầm `editRecord.id` → `editRecord.businessId`.

### 7.5. P6: ✅ HOÀN THÀNH

- `services/excel-export.js` hoàn chỉnh.
- API `GET /api/reports/export/:date`.

### 7.6. P7: ✅ HOÀN THÀNH

- Bảng `export_runs` trong Prisma schema.
- `prisma-export-run-repository.js`.
- Chống xuất trùng automatic export.
- Lịch sử xuất theo ngày và khoảng ngày.

### 7.7. P8: 🔄 ĐANG THỰC HIỆN

- ✅ Chuyển từ SQLite sang PostgreSQL (Prisma 7).
- ✅ Tạo Prisma schema với 3 models: User, Report, ExportRun.
- ✅ Tạo `prisma-report-repository.js` và `prisma-export-run-repository.js`.
- ✅ Cập nhật `app.js` để dùng Prisma.
- ✅ Cập nhật `services/excel-export.js` để dùng Prisma repositories.
- ✅ Cập nhật `services/report-service.js` để dùng Prisma repository.
- ✅ Cập nhật `services/auth-service.js` để dùng Prisma.
- ✅ Cập nhật `database/migrate.js` cho Prisma 7.
- ⏳ Cần xóa các file SQLite cũ (`database/db.js`, `database/sqlite-report-repository.js`, `database/export-run-repository.js`, `database/migrations/`).
- ⏳ Deploy lên Render với PostgreSQL database.

### 7.8. P9: ⏳ CHƯA BẮT ĐẦU

- Test parser, API tạo/sửa, chuyển trạng thái, export và chống trùng.
- Test tích hợp từ quét văn bản đến hiển thị đúng tab.
- Thêm logging có cấu trúc.
- Viết README tiếng Việt chi tiết.

---

## 8. Công nghệ sử dụng

### Backend

- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Database**: PostgreSQL 16 + Prisma 7
- **Excel**: ExcelJS
- **Auth**: JWT + bcryptjs
- **Logging**: Morgan

### Frontend

- **Framework**: React 19 + Vite 8
- **UI**: Tailwind CSS 4 (PostCSS)
- **Validation**: Joi
- **Icons**: Lucide React

---

## 9. API Endpoints

### Auth

- `POST /api/auth/login` — Đăng nhập
- `GET /api/auth/me` — Thông tin user hiện tại (requireAuth)
- `GET /api/users` — Danh sách users (requireAuth)

### Reports

- `POST /api/reports` — Tạo báo cáo mới
- `GET /api/reports?date=YYYY-MM-DD` — Danh sách báo cáo theo ngày
- `GET /api/reports/:id` — Chi tiết báo cáo
- `PUT /api/reports/:id` — Cập nhật báo cáo

### Export

- `GET /api/reports/export/:date` — Xuất Excel
- `GET /api/reports/export/history/:date` — Lịch sử xuất theo ngày
- `GET /api/reports/export/history?startDate=...&endDate=...` — Lịch sử xuất theo khoảng ngày

---

## 10. Business Rules

### 10.1. Report Status

- `pending`: `gioRa` trống hoặc không hợp lệ (HH:MM).
- `completed`: `gioRa` hợp lệ (HH:MM).

### 10.2. Validation Modes

- **Draft mode**: Cho phép `gioRa` trống, tất cả các trường khác bắt buộc.
- **Complete mode**: Yêu cầu tất cả các trường bao gồm `gioRa`.

### 10.3. Time Format

- Hỗ trợ: `HH:MM`, `H:MM`, `HH.MM`, `HH:MM:SS`
- Range: 00:00 - 23:59
- Auto-padding: `7:5` → `07:05`

### 10.4. Export Rules

- **Manual Export**: Có thể xuất nhiều lần cho cùng một ngày.
- **Automatic Export**: Chỉ được phép xuất 1 lần thành công cho mỗi ngày.

---

## 11. Known Issues / TODO

1. **Xóa file SQLite cũ**: `database/db.js`, `database/sqlite-report-repository.js`, `database/export-run-repository.js`, `database/migrations/`.
2. **Cập nhật README.md**: Đổi từ SQLite sang PostgreSQL trong documentation.
3. **Seed data**: Tạo default users (Đội ELA, Đội DTA) với password hash.
4. **Test**: Viết test cho `prisma-report-repository.js` và `prisma-export-run-repository.js`.
5. **Deploy**: Deploy lên Render với PostgreSQL database.

---

*File này được tạo từ kết quả đọc và phân tích các file trong dự án QuickReportApp vào ngày 25/07/2026.*
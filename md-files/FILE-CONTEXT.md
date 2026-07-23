# FILE-CONTEXT.md — QuickReportApp Project Context

*(Được tạo từ kết quả đọc file ngày 2026-07-23)*

---

## 1. Tổng quan dự án

**QuickReportApp** — Ứng dụng giúp nhân viên bảo vệ chuyển nội dung báo cáo logistics thô (sao chép từ Zalo) thành báo cáo chuẩn và file Excel cuối ngày.

### Kiến trúc (Giai đoạn 1)

```
React frontend (clients/) → Express API (app.js) → SQLite (storage/data/quick-report.db)
                                              └→ Excel export service → file .xlsx
```

### Module cần triển khai theo ưu tiên (từ PROJECT_CONTEXT.md)

1. (P1) `report-status` ✅ — đã hoàn thành
2. (P1) `record-validation` ✅ — đã hoàn thành (hỗ trợ 2 mode draft/complete)
3. (P2) Persistence: migration, schema, `sqlite-report-repository` ✅ — đã hoàn thành
4. **(P3) `report-service` và API** ✅ — đã hoàn thành
5. **(P4) State ngày báo cáo frontend, sửa `ReportFormModal`** ✅ — đã hoàn thành
6. **(P5) `ReportTabs`, `ReportCard`, chỉnh sửa/chuyển trạng thái** ✅ — đã hoàn thành
7. **(P6) Excel export từ database** ✅ — đã hoàn thành
8. (P7) Lịch sử xuất, chống xuất trùng
9. (P8) Chuyển cloud: Supabase + Render
10. (P9) Chất lượng, logging, test

---

## 2. Cấu trúc thư mục hiện tại

```
QuickReportApp/
├── app.js                             # Express server (4 API reports endpoints mới: POST/GET/GET/:id/PUT/:id)
├── package.json                       # type: module, dependencies + devDependencies
├── processing.md                      # Tài liệu cũ (kết quả đọc file)
├── PROJECT_CONTEXT.md                 # Bối cảnh dự án
├── FILE-CONTEXT.md                    # File này
├── Fixed-cracked-errors.md            # Log lỗi đã fix
├── tree.ps1                           # Script liệt kê cấu trúc thư mục
├── configs/
│   ├── record-schema.js               # Schema gốc: labels, groups, excelColumnMap, payloadFields, validators...
│   └── worksheet-config.js            # START_ROW=0, COL_LIMIT=13, ROW_LIMIT=150
├── database/
│   ├── db.js                          # Singleton SQLite connection (sqlite3, WAL mode)
│   ├── migrate.js                     # Migration runner (idempotent)
│   ├── migrations/
│   │   └── 001-create-reports-table.sql  # Bảng reports + indexes
│   └── sqlite-report-repository.js    # Repository: create, getByDate, getById, update, delete, getByStatus
├── services/
│   ├── report-status.js               # getReportStatus, isReportCompleted, isReportPending
│   ├── report-status.test.js          # Unit tests cho report-status + validateRecordPayload
│   ├── record-validation.js           # validateRecordPayload (2 mode) + validateRequestPayload
│   └── excel-export.js                # exportDayReport: xuất toàn bộ báo cáo 1 ngày từ DB → 2 sheet (pending/completed)
├── modules/
│   └── utils.js                       # buildTempRecordFromSupplementaryValues, getEmptyFields
├── storage/data/                      # Database SQLite file (quick-report.db)
├── templates/
│   ├── Goods_Template.xlsx
│   └── Person_Template.xlsx
├── clients/                           # React + Vite + Tailwind (frontend chính)
│   ├── src/
│   └── ...
└── public/                            # Legacy vanilla frontend (đã ngừng phát triển)
```

---

## 3. Chi tiết từng file

### 3.1. `app.js` — Express Server (đã cập nhật)

- **Vai trò**: Entry point của backend, chạy Express trên port 3000.
- **Middleware**: `cors()`, `express.json()`, `morgan("combined")`.
- **API Endpoints hiện tại**:
  - `POST /api/reports` — Tạo báo cáo mới (draft/complete mode). Trả về 201 / 400 / 500.
  - `GET /api/reports?date=YYYY-MM-DD` — Danh sách báo cáo theo ngày. Trả về 200 / 400 / 500.
  - `GET /api/reports/export/:date` — Xuất Excel báo cáo theo ngày (2 sheet: Chưa ra xưởng / Đã ra xưởng). Trả về file .xlsx / 404 / 500.
  - `GET /api/reports/:id` — Chi tiết báo cáo. Trả về 200 / 404 / 500.
  - `PUT /api/reports/:id` — Cập nhật báo cáo (tự tính lại status). Trả về 200 / 400 / 404 / 500.
- **Logging**: `morgan("combined")` cho request logging, `console.error` với prefix endpoint trong mỗi handler.
- **Lưu ý**: Endpoint cũ `POST /api/write-record` đã được thay thế hoàn toàn. Import từ `./services/report-service.js`.

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

### 3.5. `services/excel-export.js` ✅ ĐÃ HOÀN THIỆN (P6)

- **Vai trò**: Xuất toàn bộ báo cáo của một ngày từ database thành file Excel.
- **`exportDayReport(reportDate)`**: Hàm chính xuất Excel.
  1. Lấy danh sách báo cáo từ database theo ngày (`repo.getReportsByDate`).
  2. Phân loại `pending` / `completed`.
  3. Mở template `Goods_Template.xlsx`, đặt tên sheet đầu là "Chưa ra xưởng" (hoặc "Đã ra xưởng" nếu chỉ có 1 loại).
  4. Tìm dòng trống đầu tiên từ `START_ROW=3`, ghi dữ liệu từng bản ghi vào các cột theo `excelColumnMap`.
  5. Tạo sheet thứ hai "Đã ra xưởng" (copy cấu trúc header từ template) nếu có cả pending và completed.
  6. Thêm border cho tất cả dòng dữ liệu.
  7. Xuất file với tên `Báo cáo ddMMyyyyHHmmss.xlsx` vào `storage/reports/`.
- **FIELD_MAP**: Map `id` (tên cột trong excelColumnMap) → `businessId` (tên field trong record object), vì `id` là khóa chính SQLite.
- **`copySheetStructure()`**: Copy column widths, header rows (style, font, fill, alignment, border) từ template để tạo sheet thứ hai.
- **API**: `GET /api/reports/export/:date` — gọi `exportDayReport()`, trả file về client qua `res.download()`.

### 3.6. `database/db.js`

- Singleton SQLite connection dùng thư viện `sqlite3` (pure JS, prebuild binary).
- Database path mặc định: `storage/data/quick-report.db` (có thể override bằng `DB_PATH` env).
- Bật WAL mode để tăng hiệu năng đọc/ghi đồng thời.

### 3.7. `database/migrations/001-create-reports-table.sql`

- Tạo bảng `reports` với đầy đủ cột (17+ cột nghiệp vụ + id, status, timestamps).
- Index trên `report_date` và `status`.
- Cột `giay_to` là tên thay thế cho `id` (tránh keyword SQL).
- `status` mặc định `'pending'`, `created_at`/`updated_at` là ISO 8601 TEXT.

### 3.8. `database/sqlite-report-repository.js`

- **Interface đầy đủ** (thiết kế để dễ thay thế bằng Supabase):
  - `createReport(report)` — Insert, tự động tính status, trả về report mới (có id).
  - `getReportsByDate(reportDate)` — Lấy danh sách theo ngày (ORDER BY id ASC).
  - `getReportById(id)` — Lấy chi tiết 1 report.
  - `updateReport(id, updates)` — Merge với dữ liệu cũ, tự tính lại status từ `gioRa`, cập nhật `updated_at`.
  - `deleteReport(id)` — Xóa, trả về boolean.
  - `getReportsByStatus(reportDate, status)` — Lọc theo ngày + trạng thái.
- **`mapRowToReport(row)`**: Chuyển hàng SQLite (snake_case) sang camelCase + đổi `giay_to` → `businessId`.
- **`reportToValues(report)`**: Chuyển object service → mảng giá trị cho INSERT, tự động tính status.

### 3.9. `configs/record-schema.js`

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

### 3.10. `configs/worksheet-config.js`

- Cấu hình Excel: `START_ROW=0`, `COL_LIMIT=13`, `ROW_LIMIT=150`.

### 3.11. `modules/utils.js`

- `buildTempRecordFromSupplementaryValues(values)` — Xây dựng tempRecord từ form values (ghép các trường).
- `getEmptyFields(obj, fields)` — Kiểm tra field nào đang trống.

---

## 4. Trạng thái triển khai P3

### 4.5. Phân tích file đã tồn tại (kết quả đọc file ngày 2026-07-23)

#### `services/report-service.js` ✅ ĐÃ HOÀN THÀNH
- **Vai trò**: Service layer trung gian giữa API handlers và Repository.
- **Import**: `validateRecordPayload` (record-validation), `getReportStatus` (report-status), `sanitizeText`, `normalizeTime` (record-schema), toàn bộ `sqlite-report-repository`.
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
  - **Map field `id` (từ frontend form) → `businessId` (DB column `giay_to`)** để đảm bảo giá trị "Loại giấy tờ - Số giấy tờ" được lưu đúng.
  - Validate: `stt` phải numeric, `gioVao`/`gioRa` phải valid time hoặc empty.
  - Sanitize tất cả string fields.
  - Gọi `repo.updateReport(id, updates)` (tự tính lại status trong repository).
  - Trả về `"Report not found."` nếu null (404), lỗi khác (400).
- **`getReportsByStatus(reportDate, status)`**: Validate `status` phải là `'pending'` hoặc `'completed'`.
- **Logging**: `console.error` với prefix `[report-service]` trong tất cả catch blocks.
- **Export**: Named exports + default object export.

#### `app.js` ✅ ĐÃ CẬP NHẬT
- **Import**: `createReport`, `getReportsByDate`, `getReportById`, `updateReport` từ `./services/report-service.js`.
- **Middleware**: `cors()`, `express.json()`, `morgan("combined")`.
- **POST `/api/reports`**: Tạo báo cáo → 201 với `{ success: true, data }` / 400 với `{ success: false, message }` / 500 nếu server error.
- **GET `/api/reports?date=YYYY-MM-DD`**: Danh sách theo ngày → 200 / 400 / 500.
- **GET `/api/reports/:id`**: Chi tiết báo cáo → Parse id từ params, kiểm tra NaN → 400; gọi `getReportById` → 404 nếu not found / 200.
- **PUT `/api/reports/:id`**: Cập nhật → Parse id, kiểm tra NaN → 400; gọi `updateReport` → 404 nếu `"Report not found."` / 400 lỗi khác / 200.
- **Endpoint cũ `/api/write-record`**: ✅ **Đã được thay thế hoàn toàn** bằng 4 API mới.
- **Error handling**: Mỗi handler có try/catch riêng với `console.error` + prefix endpoint.
- **Server start**: `app.listen(PORT, () => { console.log(...) })`.

#### `services/record-validation.js` ✅ GIỮ NGUYÊN
- Hai mode: `draft` (cho phép `gioRa` rỗng → pending) và `complete` (yêu cầu `gioRa` hợp lệ).
- `requiredDraftFields`: Tất cả required fields trừ `gioRa`.
- `requiredCompleteFields`: Tất cả required fields bao gồm `gioRa`.
- `buildRecord(normalizedInput)`: Xây dựng record object 13 field (payloadFields) + chuẩn hóa thời gian.
- `validateRecordPayload(payload, mode)`: Parse JSON nếu string, normalize input, sanitize, validate stt numeric, validate gioVao, validate gioRa (nếu complete mode), check required fields, build record, tính status.
- `validateRequestPayload(rawBody, mode)`: Wrapper hỗ trợ `tempRecord` (từ form multipart).

#### `services/report-status.js` ✅ GIỮ NGUYÊN
- `REPORT_STATUS`: `PENDING = "pending"`, `COMPLETED = "completed"`.
- `getReportStatus(record)`: `gioRa` hợp lệ (HH:MM) → `completed`, ngược lại → `pending`.
- Sử dụng `normalizeTime` từ record-schema.

#### `database/sqlite-report-repository.js` ✅ GIỮ NGUYÊN
- `COLUMNS`: 19 cột (bao gồm id, report_date, ..., status, created_at, updated_at).
- `mapRowToReport(row)`: Chuyển snake_case → camelCase, `giay_to` → `businessId`.
- `reportToValues(report)`: Chuyển object → mảng values cho INSERT, tự động tính status.
- `createReport(report)`: INSERT → SELECT để lấy bản ghi mới.
- `getReportsByDate(reportDate)`: SELECT WHERE report_date = ? ORDER BY id ASC.
- `getReportById(id)`: SELECT WHERE id = ?.
- `updateReport(id, updates)`: Lấy existing → merge → **tự động tính lại status từ gioRa** → UPDATE → SELECT.
- `deleteReport(id)`: DELETE, trả về boolean.
- `getReportsByStatus(reportDate, status)`: SELECT WHERE date AND status.

#### `configs/record-schema.js`
- `RECORD_SCHEMA` object: labels, groups, excelColumnMap, payloadFields (13 fields), formFields (17 fields), requiredPayloadFields (10 fields), aliases, textAliases, fieldTypes, validators.
- Hàm chính: `sanitizeText`, `normalizeTime`, `normalizeRecordInput`, `buildRecordPayload`, `createInitialRecordForm`.
- `normalizeTime`: Xử lý HH:MM, H:MM, HH.MM, HH:MM:SS, out-of-range → empty string.

#### `database/migrations/001-create-reports-table.sql`
- Bảng `reports`: 19 cột, `status` default `'pending'`, `created_at`/`updated_at` TEXT ISO 8601.
- Index trên `report_date` và `status`.

---

### 4.6. Trạng thái P3: ✅ ĐÃ HOÀN THÀNH

Tất cả 5 mục tiêu của P3 đã được triển khai đầy đủ:

1. ✅ **`services/report-service.js`** — Service layer hoàn chỉnh dùng repository + validation + status rule.
2. ✅ **Thay luồng cũ `/api/write-record`** — `app.js` đã sử dụng 4 API endpoints mới, endpoint cũ đã được loại bỏ.
3. ✅ **4 API endpoints**:
   - `POST /api/reports` — Tạo báo cáo (201) với hỗ trợ draft/complete mode.
   - `GET /api/reports?date=YYYY-MM-DD` — Danh sách theo ngày (200).
   - `GET /api/reports/:id` — Chi tiết báo cáo (200/404).
   - `PUT /api/reports/:id` — Cập nhật báo cáo (200/400/404).
4. ✅ **API cập nhật tự tính lại status** — `repo.updateReport` gọi `getReportStatus(merged)` sau khi merge updates.
5. ✅ **Error responses + logging** — `morgan("combined")`, `console.error` với prefix endpoint/service, response format `{ success, message }` cho lỗi.

### 4.7. Trạng thái P4: ✅ ĐÃ HOÀN THÀNH

P4 đã triển khai đầy đủ 5 mục tiêu:

1. ✅ **`ReportDatePicker` + state ngày báo cáo**: Component mới `clients/src/components/report/ReportDatePicker.jsx`, state `reportDate` trong `ExportContext` (mặc định = hôm nay).
2. ✅ **Gắn `reportDate` vào dữ liệu khi quét và lưu**: `ReportFormModal.handleSubmit` gọi `createReport({ reportDate, ...payload, mode })`.
3. ✅ **Đổi nội dung `ReportFormModal`**: Từ "Xuất Excel" → "Lưu báo cáo". Mô tả cập nhật, nút submit đổi thành "Lưu báo cáo".
4. ✅ **Modal quét giữ giá trị đã parse**: `ReportChat` parse text → `setInitForm(normalizes)` → `ReportFormModal` mở form đã điền sẵn (luồng cũ vẫn hoạt động).
5. ✅ **Gọi API + hiển thị lỗi/thành công**: `createReport()` từ `clients/src/utils/api.js`, message xanh (thành công) / đỏ (lỗi), tự đóng modal sau 1.5s.

**Các file mới/sửa trong P4:**
- `clients/src/utils/date.js` (mới) — Tiện ích ngày tháng
- `clients/src/utils/api.js` (mới) — Gọi API backend (fetch + proxy)
- `clients/src/components/report/ReportDatePicker.jsx` (mới) — Date picker với nút chuyển ngày
- `clients/vite.config.js` (sửa) — Thêm proxy `/api` → `http://localhost:3000`
- `clients/src/contexts/ExportContext.jsx` (sửa) — Thêm state `reportDate`
- `clients/src/components/report/ReportFormModal.jsx` (sửa) — API call + message feedback
- `clients/src/App.jsx` (sửa) — Thêm `ReportDatePicker`, layout mới
- `clients/src/components/report/index.js` (sửa) — Export `ReportDatePicker`

### 4.8. Kế thừa cho P5 trở đi

- **P5 (ReportTabs, ReportCard, chỉnh sửa/chuyển trạng thái)**: Dùng `PUT /api/reports/:id`, `GET /api/reports?date=...&status=...` và state `reportDate` từ context.
- **P6 (Excel export từ database)**: Cần API mới đọc từ database thay vì ghi trực tiếp vào template.
- **P9 (Chất lượng, logging, test)**: Cần viết unit test cho `report-service.js`.

---

### 4.8. Luồng tạo báo cáo mới (so sánh với luồng cũ)

**Luồng cũ** (`POST /api/write-record`):
```
Client → validateRequestPayload → buildWorkbookFromRecord → write buffer → download .xlsx
```

**Luồng mới** (`POST /api/reports`):
```
Client → report-service.createReport → validateRecordPayload → getReportStatus → repository.createReport → response JSON
```

**Luồng cập nhật** (`PUT /api/reports/:id`):
```
Client → report-service.updateReport → validate partial → getReportStatus → repository.updateReport → response JSON
```

Việc xuất Excel sẽ tách riêng ra API riêng (P6), đọc từ database thay vì nhận record đơn lẻ.

---

## 5. Tổng kết

- **P0-P2 đã hoàn thành**: Schema, validation (2 mode), status rule, SQLite + migration, repository CRUD.
- **P3 đã hoàn thành**: `report-service.js` + 4 API endpoints thay thế endpoint cũ. ✅
- **Kế thừa**: `report-service.js` dùng `validateRecordPayload` (record-validation), `getReportStatus` (report-status), và các repository methods.
- **Không thay đổi**: Các file service/repository hiện tại, chỉ thêm mới `report-service.js` và sửa `app.js`.
- **Kế tiếp (P4)**: State ngày báo cáo frontend, sửa `ReportFormModal` để gọi API mới.

---

*File này được tạo từ kết quả đọc và phân tích các file trong dự án QuickReportApp vào ngày 23/07/2026.*
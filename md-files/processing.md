# Kết quả đọc file

Tài liệu này chứa kết quả của việc đọc các file trong dự án QuickReportApp, được xuất ra bởi công cụ xử lý.

---

## 1. File: `TODO.md`

Đây là kế hoạch triển khai dự án QuickReportApp, được sắp xếp theo các mức độ phụ thuộc (P0 → P9). Tài liệu này nêu rõ ràng rằng không được triển khai cloud hay scheduler cho đến khi luồng lưu/sửa báo cáo hoạt động ổn định.

### P0 — Chốt nền tảng

- [x] Chọn React (`clients/`) là frontend chính.
- [x] Ngừng bổ sung tính năng mới cho `public/` legacy. (đã xóa)
- [x] Rà và sửa các import/export React để build ổn định trên môi trường Linux/CI.
- [x] Gom parser về một implementation duy nhất.
- [x] Xóa hoặc hợp nhất các nhãn/alias trùng với `configs/record-schema.js`.

### P1 — Nghiệp vụ và kiểm tra dữ liệu ✅ ĐÃ HOÀN THÀNH

- [x] Viết `report-status`: `gioRa` trống là `pending`; `gioRa` hợp lệ là `completed`.
- [x] Quy định rõ tập trường bắt buộc khi lưu `pending` (requiredDraftFields: tất cả trừ `gioRa`).
- [x] Quy định rõ tập trường bắt buộc khi lưu `completed` (requiredCompleteFields: tất cả 10 fields bao gồm `gioRa`).
- [x] Cập nhật validator để hỗ trợ hai chế độ: lưu tạm (`draft`) và hoàn tất (`complete`).
- [x] Viết test cho chuẩn hóa giờ, phân loại trạng thái và validation (27 tests).

### P2 — Lưu trữ SQLite

- [x] Chọn thư viện SQLite và cấu hình kết nối `storage/data/quick-report.db`.
- [x] Tạo migration/schema bảng `reports`.
- [x] Các cột tối thiểu: `id`, `report_date`, dữ liệu nghiệp vụ, `raw_text`, `status`, `created_at`, `updated_at`.
- [x] Tạo `sqlite-report-repository` cho tạo, lấy theo ngày, lấy chi tiết và cập nhật báo cáo.
- [x] Thêm dữ liệu/migration an toàn cho database đã tồn tại.

### P3 — Service và API báo cáo

- [x] Viết `report-service` sử dụng repository và rule trạng thái.
- [x] Thay luồng cũ `/api/write-record` bằng API lưu báo cáo.
- [x] Tạo API: tạo báo cáo, danh sách theo ngày, chi tiết và cập nhật báo cáo.
- [x] API cập nhật phải tự tính lại status sau khi sửa `gioRa`.
- [x] Thêm phản hồi lỗi rõ ràng và logging phía server.

### P4 — Luồng React tạo/lưu báo cáo ✅ ĐÃ HOÀN THÀNH

- [x] Thêm `ReportDatePicker` và state ngày báo cáo hiện hành.
- [x] Gắn `reportDate` vào dữ liệu khi quét và lưu.
- [x] Đổi nội dung `ReportFormModal` từ "Xuất Excel" thành "Thêm/Lưu báo cáo".
- [x] Modal quét giữ giá trị đã parse và mở form đã điền sẵn.
- [x] Gọi API lưu báo cáo; hiển thị lỗi/thành công cho người dùng.

### P5 — Tabs, card và chỉnh sửa ✅ ĐÃ HOÀN THÀNH

- [x] Tạo `ReportTabs` cho **Đã ra xưởng** và **Chưa ra xưởng**.
- [x] Tạo `ReportCard` không dùng ảnh; hiển thị thông tin nhận diện, giờ vào/ra và cảnh báo thiếu dữ liệu.
- [x] Tải danh sách theo ngày đã chọn và theo status.
- [x] Trên card `pending`, hiện nút **Chỉnh sửa** khi hover/focus.
- [x] Chỉnh sửa mở lại modal với dữ liệu cũ.
- [x] Lưu với giờ ra hợp lệ thì card tự chuyển sang tab hoàn tất.
- [x] Fix bug: form chỉnh sửa lấy nhầm `editRecord.id` (khóa chính) thay vì `editRecord.businessId` cho field "Loại giấy tờ - Số giấy tờ".
- [x] Fix bug: backend `updateReport` không nhận field `id` từ frontend → thêm logic map `id` → `businessId`.

### P6 — Xuất Excel thủ công ✅ ĐÃ HOÀN THÀNH

- [x] Hoàn thiện `services/excel-export.js` để xuất toàn bộ báo cáo của một ngày từ database.
- [x] Xác nhận cách bố trí: hai sheet theo status (Chưa ra xưởng / Đã ra xưởng).
- [x] Tạo API xuất Excel theo ngày đang chọn (`GET /api/reports/export/:date`).
- [x] Đặt tên chuẩn `Báo cáo ddMMyyyyHHmmss.xlsx`.
- [x] Chỉ đặt nút **Xuất Excel** ở màn hình danh sách, không đặt trong modal form.
- [x] Kiểm tra template, format, merge cells, border và dữ liệu thiếu.

### P7 — Lịch sử và chống xuất trùng

- [ ] Tạo bảng `export_runs`.
- [ ] Lưu: ngày báo cáo, loại xuất (`manual`/`automatic`), thời điểm, tên file, trạng thái, lỗi và URL/đường dẫn file.
- [ ] Trước khi xuất tự động, kiểm tra đã có lượt xuất tự động thành công cho ngày đó chưa.
- [ ] Có cơ chế xuất bù nếu máy/service không hoạt động đúng 00:00.

### P8 — Chuyển cloud: Supabase + Render

- [ ] Tạo Supabase project và PostgreSQL schema tương ứng.
- [ ] Viết `supabase-report-repository` cùng interface với SQLite repository.
- [ ] Tạo Supabase Storage bucket `report-exports`.
- [ ] Đưa backend lên Render.
- [ ] Tạo Render Cron Job lúc `00:00` theo `Asia/Ho_Chi_Minh`.
- [ ] Job tạo Excel, tải file lên Supabase Storage và ghi `export_runs`.
- [ ] Dùng biến môi trường cho URL/key; tuyệt đối không commit secret.

### P9 — Chất lượng và vận hành

- [ ] Test parser, API tạo/sửa, chuyển trạng thái, export và chống trùng.
- [ ] Test tích hợp từ quét văn bản đến hiển thị đúng tab.
- [ ] Thêm logging có cấu trúc cho lỗi lưu/export/scheduler.
- [ ] Thêm backup, cảnh báo lỗi job và hướng dẫn phục hồi.
- [ ] Viết README tiếng Việt: chạy local, biến môi trường, migration, deploy và quy trình xử lý lỗi.

### Chưa thuộc phạm vi hiện tại

- [ ] Ảnh xe/CCCD/seal và Multer: giữ lại cho phase sau khi luồng báo cáo chính ổn định.
- [ ] PWA/offline draft: chỉ làm sau khi persistence và sync đã rõ ràng.
- [ ] Xác thực/phân quyền: thực hiện trước khi mở cho nhiều người dùng ngoài phạm vi nội bộ.

---

## 2. File: `configs/record-schema.js`

Đây là file cấu hình định nghĩa cấu trúc (schema) và các hàm tiện ích xử lý dữ liệu báo cáo trong dự án. File này chứa các hàm chuẩn hóa (normalize), làm sạch (sanitize) và xây dựng payload gửi lên API.

### Các hàm tiện ích (utility functions)

#### `sanitizeText(value)`

- **Mục đích**: Làm sạch giá trị đầu vào thành chuỗi ký tự (string) và loại bỏ khoảng trắng thừa.
- **Xử lý**:
  - Nếu giá trị là `null` hoặc `undefined` → trả về chuỗi rỗng `""`.
  - Nếu giá trị là chuỗi → trả về chuỗi đã được `trim()`.
  - Nếu giá trị khác kiểu → chuyển thành chuỗi rồi `trim()`.

#### `joinNonEmptyValues(values = [], joiner = " - ")`

- **Mục đích**: Nối các giá trị không rỗng trong một mảng thành một chuỗi, ngăn cách bởi `joiner` (mặc định là `" - "`).
- **Xử lý**:
  - Lọc bỏ các giá trị `null`, `undefined` và chuỗi rỗng.
  - Áp dụng `sanitizeText` cho từng giá trị còn lại.
  - Nối các giá trị bằng `joiner`.

#### `normalizeTime(value)`

- **Mục đích**: Chuẩn hóa giờ theo định dạng `HH:MM`.
- **Xử lý**:
  - Làm sạch giá trị bằng `sanitizeText`.
  - Nếu rỗng → trả về `""`.
  - Dùng regex `^(\d{1,2})(?:[:.](\d{1,2}))(?:[:.](\d{1,2}))?$` để khớp giờ, phút (và giây nếu có).
  - Nếu không khớp → trả về nguyên văn.
  - Kiểm tra giờ trong khoảng `[0, 23]` và phút trong khoảng `[0, 59]`; nếu ngoài → trả về `""`.
  - Trả về chuỗi `HH:MM` với zero-padding (ví dụ: `"07:05"`).

### Đối tượng `RECORD_SCHEMA`

Đây là đối tượng chứa toàn bộ cấu hình schema của bản ghi báo cáo, được xuất khẩu trực tiếp (thay thế cho lớp `RecordSchema` cũ). Đối tượng này chứa các thuộc tính sau:

#### `labels`

- Bản đồ các nhãn hiển thị (tiếng Việt) cho từng trường.
- Ví dụ: `stt: "Số thứ tự"`, `hoTen: "Họ tên/Tài xế/NMH"`, `gioVao: "Giờ vào"`, `gioRa: "Giờ ra"`.

#### `groups`

- Mảng các nhóm trường, dùng để bố trí form UI.
- Ví dụ: `["hoTen", "thuocCtyDonVi"]` — hai trường này được nhóm lại.

#### `excelColumnMap`

- Bản đồ ánh xạ tên trường sang số cột Excel (1-based).
- Ví dụ: `stt: 1`, `hoTen_ThuocCtyDonVi: 2`, `gioRa: 12`, `ghiChu: 13`.

#### `payloadFields`

- Danh sách các trường được gửi lên API (dạng ghộp).
- Bao gồm: `stt`, `hoTen_ThuocCtyDonVi`, `xuongGiao`, `xuongNhan`, `soThe`, `id`, `loaiPhuongTien_BSX_BKSRomooc`, `soCont_SoSeal`, `chiTietHangHoa`, `soPhieu`, `gioVao`, `gioRa`, `ghiChu`.

#### `formFields`

- Danh sách các trường dùng trong form (dạng tách nhỏ).
- Bao gồm: `stt`, `hoTen`, `thuocCtyDonVi`, `xuongGiao`, `xuongNhan`, `soThe`, `id`, `loaiPhuongTien`, `bks`, `bksRomooc`, `soCont`, `soSeal`, `chiTietHangHoa`, `soPhieu`, `gioVao`, `gioRa`, `ghiChu`.

#### `requiredPayloadFields`

- Danh sách các trường bắt buộc khi gửi payload lên API.
- Bao gồm: `stt`, `hoTen_ThuocCtyDonVi`, `xuongGiao`, `xuongNhan`, `soThe`, `loaiPhuongTien_BSX_BKSRomooc`, `chiTietHangHoa`, `soPhieu`, `gioVao`, `gioRa`.

#### `aliases`

- Bản đồ các bí danh (alias) cho từng trường, dùng để tìm giá trị thay thế khi trường chính không có giá trị.
- Ví dụ: `id: ["cccd"]`, `hoTen: ["hoTen_ThuocCtyDonVi"]`, `bks: ["loaiPhuongTien_BSX_BKSRomooc"]`.

#### `fieldTypes`

- Bản đồ kiểu dữ liệu của từng trường.
- Ví dụ: `stt: "number"`, `hoTen: "string"`, `gioVao: "time"`, `gioRa: "time"`.

#### `validators`

- Bản đồ các hàm kiểm tra (validator) cho từng trường.
- `stt`: Kiểm tra giá trị là số nguyên dương (`/^\d+$/`).
- `gioVao`: Kiểm tra giá trị hợp lệ qua `normalizeTime`.
- `gioRa`: Kiểm tra giá trị hợp lệ qua `normalizeTime`.

### Các hàm hỗ trợ nội bộ (không xuất khẩu)

#### `resolveFieldValue(values = {}, fieldName, aliases = [])`

- **Mục đích**: Tìm giá trị của một trường trong đối tượng `values`, thử cả tên trường chính và các bí danh (alias).
- **Xử lý**:
  - Duyệt qua danh sách `[fieldName, ...aliases]`.
  - Trả về giá trị đầu tiên không rỗng (sau `sanitizeText`).
  - Nếu không tìm thấy → trả về `""`.

#### `resolveCompoundField(values = {}, fieldName, sourceFields = [])`

- **Mục đích**: Xây dựng giá trị ghộp từ nhiều trường nguồn (ví dụ: `hoTen - thuocCtyDonVi`).
  - Nếu giá trị trường `fieldName` tồn tại → dùng giá trị đó.
  - Nếu không → nối các giá trị từ `sourceFields` bằng `joinNonEmptyValues`.

### Hàm xuất khẩu chính

#### `normalizeRecordInput(values = {})`

- **Mục đích**: Chuẩn hóa toàn bộ dữ liệu đầu vào thành một đối tượng có cấu trúc cố định.
- **Xử lý**:
  - Đảm bảo `values` là đối tượng (object) không phải mảng.
  - Gọi `resolveFieldValue` để lấy giá trị từng trường (có hỗ trợ alias qua `RECORD_SCHEMA.aliases`).
  - Gọi `normalizeTime` cho các trường `gioVao` và `gioRa`.
  - Tạo các trường ghộp:
    - `hoTen_ThuocCtyDonVi`: ghộp từ `hoTen` và `thuocCtyDonVi`.
    - `loaiPhuongTien_BSX_BKSRomooc`: ghộp từ `loaiPhuongTien`, `bks`, `bksRomooc`.
    - `soCont_SoSeal`: ghộp từ `soCont` và `soSeal`.
  - Trả về đối tượng đã chuẩn hóa.

#### `createInitialRecordForm(initValues = {})`

- **Mục đích**: Tạo đối tượng form ban đầu với các giá trị mặc định.
- **Xử lý**:
  - Dựa trên `RECORD_SCHEMA.formFields` để tạo cặp `key: value`.
  - Giá trị mặc định: `initValues[fieldName]` nếu có, ngược lại `""`.

#### `buildRecordPayload(values = {})`

- **Mục đích**: Chuyển đổi dữ liệu form thành payload gửi lên API.
- **Xử lý**:
  - Gọi `normalizeRecordInput` để chuẩn hóa.
  - Chọn ra các trường nằm trong `RECORD_SCHEMA.payloadFields`.
  - Trả về đối tượng payload.
  - **Lưu ý**: Không gửi các trường tách biệt dùng cho UI như `hoTen`, `bks` mà thay vào đó là các trường ghộp tương ứng.

---

## 3. Lịch sử thay đổi (Git)

### Các commit liên quan đến `configs/record-schema.js`

1. **Commit `b35ebc0`** — "Add UI and adjust project to be scalable and developable"
   - Phiên bản đầu tiên của file với `RECORD_SCHEMA` được định nghĩa đầy đủ.
   - `createInitialRecordForm()` không nhận tham số `initValues`.

2. **Commit `2f43d5c` (HEAD)** — "Làm mới quy trình nghiệp vụ, fix những cái cơ bản"
   - Thay thế lớp `RecordSchema` (chưa cài đặt) bằng đối tượng `RECORD_SCHEMA` đã đầy đủ.
   - Cập nhật `createInitialRecordForm(initValues = {})` để chấp nhận giá trị khởi tạo.
   - Sửa giá trị mặc định từ `""` thành `initValues[fieldName] ?? ""`.

### Diff chính giữa `b35ebc0` và `HEAD`

```diff
-export function createInitialRecordForm() {
+export function createInitialRecordForm(initValues = {}) {
   return Object.fromEntries(
-    RECORD_SCHEMA.formFields.map((fieldName) => [fieldName, ""]),
+    RECORD_SCHEMA.formFields.map((fieldName) => [
+      fieldName,
+      initValues[fieldName] ?? "",
+    ]),
   );
 }
```

---

## 4. Thay đổi đã thực hiện

### Cập nhật `configs/record-schema.js`

- **Xóa lớp `RecordSchema`** (chưa cài đặt các phương thức `getFieldTypes()`, `getFielAliases()`, `getValues()`, `validators()`).
- **Thay thế bằng đối tượng `RECORD_SCHEMA`** được định nghĩa đầy đủ với các thuộc tính: `labels`, `groups`, `excelColumnMap`, `payloadFields`, `formFields`, `requiredPayloadFields`, `aliases`, `fieldTypes`, `validators`.
- **Sửa lỗi `createInitialRecordForm`**: Giá trị mặc định từ `"" || 0` (luôn bằng `0`) thành `""` (chuỗi rỗng).
- **Dịch các nhãn tiếng Việt** trong `RECORD_SCHEMA.labels` từ mã hóa lỗi (UTF-8 bị hỏng) sang tiếng Việt đúng.

### Xóa các file trống (bỏ qua `node_modules`)

Đã xóa 17 file trống không chứa logic trong dự án (không tính thư mục `node_modules`):

| Thư mục | Tên file |
| --------- | ---------- |
| `clients/src/features/excel/` | `exporter.js` |
| `clients/src/features/image/` | `compressor.js`, `index.js`, `uploader.js` |
| `clients/src/features/report/` | `builder.js`, `index.js`, `normalizer.js` |
| `clients/src/features/storage/` | `index.js`, `indexed-db.js`, `local-storage.js` |
| `clients/src/hooks/` | `useDebounce.js`, `useLocalStorage.js` |
| `clients/src/utils/` | `array.js`, `date.js`, `object.js`, `string.js` |
| `modules/` | `parser.js` |

---

*File này được tạo tự động bởi công cụ xử lý — kết quả của việc đọc và phân tích các file trong dự án QuickReportApp.*
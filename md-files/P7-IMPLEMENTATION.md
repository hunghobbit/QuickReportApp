# P7 — Lịch sử và chống xuất trùng

## Tổng quan

Đã triển khai thành công 2 tính năng chính của P7:

1. **Chống xuất trùng** (Duplicate export prevention)
2. **Lịch sử xuất** (Export history tracking)

*Lưu ý: Không triển khai xuất tự động (automatic export) theo yêu cầu.*

---

## 1. Database Schema

### Bảng `export_runs`

Đã tạo migration `002-create-export-runs-table.sql` với cấu trúc:

```sql
CREATE TABLE IF NOT EXISTS export_runs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date     TEXT    NOT NULL,           -- YYYY-MM-DD
    export_type     TEXT    NOT NULL DEFAULT 'manual',  -- manual | automatic
    exported_at     TEXT    NOT NULL,           -- ISO 8601
    file_name       TEXT    NOT NULL,           -- Tên file đã xuất
    file_path       TEXT    NOT NULL,           -- Đường dẫn đầy đủ
    status          TEXT    NOT NULL DEFAULT 'success',  -- success | failed
    error_message   TEXT    DEFAULT '',         -- Thông báo lỗi nếu failed
    created_at      TEXT    NOT NULL            -- ISO 8601
);
```

**Indexes:**

- `idx_export_runs_report_date` - Tra cứu nhanh theo ngày
- `idx_export_runs_export_type` - Tra cứu nhanh theo loại xuất
- `idx_export_runs_status` - Tra cứu nhanh theo trạng thái
- `idx_export_runs_date_type` - Tìm lượt xuất gần nhất theo ngày và loại

---

## 2. Repository Layer

### File: `database/export-run-repository.js`

Các hàm chính:

#### `createExportRun(exportRun)`

Tạo bản ghi lịch sử xuất mới.

#### `hasSuccessfulExport(reportDate, exportType)`

Kiểm tra đã có lượt xuất thành công cho ngày và loại xuất chưa.

- Trả về `true` nếu đã có lượt xuất thành công
- Dùng để chống xuất trùng cho automatic export

#### `getExportRunsByDate(reportDate)`

Lấy lịch sử xuất theo ngày.

#### `getExportRunsByDateRange(startDate, endDate)`

Lấy lịch sử xuất theo khoảng ngày.

#### `getLatestExportRun(reportDate, exportType)`

Lấy lượt xuất gần nhất theo ngày và loại.

---

## 3. Service Layer

### File: `services/excel-export.js`

#### Thay đổi hàm `exportDayReport(reportDate, exportType = "manual")`

**Thêm tham số `exportType`:**

- `"manual"` (mặc định) - Xuất thủ công, có thể xuất nhiều lần
- `"automatic"` - Xuất tự động, chỉ được phép 1 lần thành công

**Logic chống xuất trùng:**

```javascript
// Chỉ kiểm tra cho automatic export
if (exportType === "automatic") {
  const hasExported = await exportRunRepo.hasSuccessfulExport(reportDate, "automatic");
  if (hasExported) {
    throw new Error(
      `Đã có lượt xuất tự động thành công cho ngày ${reportDate}. Không thể xuất trùng.`
    );
  }
}
```

**Lưu lịch sử sau khi xuất thành công:**

```javascript
// Lưu lịch sử xuất vào database
try {
  await exportRunRepo.createExportRun({
    reportDate,
    exportType,
    exportedAt: new Date().toISOString(),
    fileName,
    filePath,
    status: "success",
  });
} catch (historyError) {
  console.error("⚠️ Không thể lưu lịch sử xuất:", historyError);
  // Không throw error vì file đã xuất thành công
}
```

**Cải tiến tên file:**

- Thêm milliseconds vào timestamp để tránh trùng tên file khi xuất nhiều lần trong cùng giây
- Format: `Báo cáo ddMMyyyyHHmmssSSS.xlsx`

---

## 4. API Endpoints

### File: `app.js`

#### `GET /api/reports/export/:date`

Xuất Excel báo cáo theo ngày (manual export).

**Response thành công (200):**

- File Excel được download

**Response lỗi:**

- `400` - Date format không hợp lệ
- `404` - Không có báo cáo cho ngày đó
- `500` - Lỗi server

#### `GET /api/reports/export/history/:date`

Lấy lịch sử xuất theo ngày.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reportDate": "2024-12-25",
      "exportType": "manual",
      "exportedAt": "2024-12-25T10:30:00.000Z",
      "fileName": "Báo cáo 25122024103000123.xlsx",
      "filePath": "/path/to/file.xlsx",
      "status": "success",
      "errorMessage": "",
      "createdAt": "2024-12-25T10:30:00.000Z"
    }
  ]
}
```

#### `GET /api/reports/export/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

Lấy lịch sử xuất theo khoảng ngày.

**Query Parameters:**

- `startDate` (required) - Ngày bắt đầu (YYYY-MM-DD)
- `endDate` (required) - Ngày kết thúc (YYYY-MM-DD)

**Response:**

```json
{
  "success": true,
  "data": [
    // Mảng export runs
  ]
}
```

---

## 5. Cách hoạt động

### Luồng xuất thủ công (Manual Export)

1. User gọi `GET /api/reports/export/:date`
2. Hệ thống kiểm tra dữ liệu báo cáo
3. Xuất file Excel
4. Lưu lịch sử vào `export_runs` với `export_type = "manual"`
5. Trả file về client
6. **Có thể xuất lại nhiều lần** cho cùng ngày

### Luồng xuất tự động (Automatic Export) - P8

1. Scheduler gọi `exportDayReport(date, "automatic")`
2. Hệ thống kiểm tra `export_runs`:
   - Nếu đã có `export_type = "automatic"` và `status = "success"` → **Từ chối xuất**
   - Nếu chưa có → Tiếp tục xuất
3. Xuất file Excel
4. Lưu lịch sử vào `export_runs` với `export_type = "automatic"`
5. **Chỉ được phép xuất 1 lần thành công** cho mỗi ngày

---

## 6. Testing

### Test Script: `test-p7-comprehensive.js`

Đã test các trường hợp:

1. ✅ Lấy lịch sử xuất ban đầu (rỗng)
2. ✅ Xuất Excel thủ công lần 1
3. ✅ Kiểm tra lịch sử sau khi xuất (có 1 bản ghi)
4. ✅ Thử xuất tự động lần 1 (thành công)
5. ✅ Thử xuất tự động lần 2 (bị chặn - duplicate prevention hoạt động)
6. ✅ Xuất thủ công lần 2 (được phép)
7. ✅ Xuất tự động ngày khác (được phép)
8. ✅ Lấy lịch sử theo khoảng ngày
9. ✅ Thử xuất tự động lần 2 cho ngày khác (bị chặn)

### Chạy test

```bash
node test-p7-comprehensive.js
```

---

## 7. Files đã thay đổi/tạo mới

### Files mới

- `database/migrations/002-create-export-runs-table.sql` - Migration tạo bảng export_runs
- `database/export-run-repository.js` - Repository cho export_runs
- `test-p7.js` - Test script đơn giản
- `test-p7-comprehensive.js` - Test script đầy đủ
- `P7-IMPLEMENTATION.md` - Tài liệu này

### Files đã sửa

- `services/excel-export.js` - Thêm chống xuất trùng và lưu lịch sử
- `app.js` - Thêm 2 API endpoints mới cho lịch sử xuất

---

## 8. Lưu ý cho P8 (Chuyển cloud)

Khi chuyển sang Supabase + Render:

1. Tạo bảng `export_runs` tương ứng trong PostgreSQL
2. Viết `supabase-export-run-repository` với cùng interface
3. Render Cron Job sẽ gọi `exportDayReport(date, "automatic")`
4. Hệ thống tự động chống xuất trùng mà không cần thêm logic ở scheduler

---

## 9. Trạng thái hoàn thành

- [x] Tạo bảng `export_runs`
- [x] Lưu: ngày báo cáo, loại xuất, thời điểm, tên file, trạng thái, lỗi và đường dẫn
- [x] Kiểm tra trước khi xuất tự động (đã có lượt xuất thành công chưa)
- [ ] Cơ chế xuất bù (P8 - sẽ làm khi có scheduler)

---

*Hoàn thành lúc: 2026-07-23*.

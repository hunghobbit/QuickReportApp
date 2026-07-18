# Kế hoạch triển khai QuickReportApp

Tài liệu này sắp xếp công việc theo phụ thuộc. Không triển khai cloud hay scheduler trước khi luồng lưu/sửa báo cáo hoạt động ổn định.

## P0 — Chốt nền tảng

- [x] Chọn React (`clients/`) là frontend chính.
- [x] Ngừng bổ sung tính năng mới cho `public/` legacy. (đã xóa)
- [x] Rà và sửa các import/export React để build ổn định trên môi trường Linux/CI.
- [x] Gom parser về một implementation duy nhất.
- [ ] Xóa hoặc hợp nhất các nhãn/alias trùng với `configs/record-schema.js`.

## P1 — Nghiệp vụ và kiểm tra dữ liệu

- [ ] Viết `report-status`: `gioRa` trống là `pending`; `gioRa` hợp lệ là `completed`.
- [ ] Quy định rõ tập trường bắt buộc khi lưu `pending`.
- [ ] Quy định rõ tập trường bắt buộc khi lưu `completed`.
- [ ] Cập nhật validator để hỗ trợ hai chế độ: lưu tạm và hoàn tất.
- [ ] Viết test cho chuẩn hóa giờ, phân loại trạng thái và validation.

## P2 — Lưu trữ SQLite

- [ ] Chọn thư viện SQLite và cấu hình kết nối `storage/data/quick-report.db`.
- [ ] Tạo migration/schema bảng `reports`.
- [ ] Các cột tối thiểu: `id`, `report_date`, dữ liệu nghiệp vụ, `raw_text`, `status`, `created_at`, `updated_at`.
- [ ] Tạo `sqlite-report-repository` cho tạo, lấy theo ngày, lấy chi tiết và cập nhật báo cáo.
- [ ] Thêm dữ liệu/migration an toàn cho database đã tồn tại.

## P3 — Service và API báo cáo

- [ ] Viết `report-service` sử dụng repository và rule trạng thái.
- [ ] Thay luồng cũ `/api/write-record` bằng API lưu báo cáo.
- [ ] Tạo API: tạo báo cáo, danh sách theo ngày, chi tiết và cập nhật báo cáo.
- [ ] API cập nhật phải tự tính lại status sau khi sửa `gioRa`.
- [ ] Thêm phản hồi lỗi rõ ràng và logging phía server.

## P4 — Luồng React tạo/lưu báo cáo

- [ ] Thêm `ReportDatePicker` và state ngày báo cáo hiện hành.
- [ ] Gắn `reportDate` vào dữ liệu khi quét và lưu.
- [ ] Đổi nội dung `ReportFormModal` từ “Xuất Excel” thành “Thêm/Lưu báo cáo”.
- [ ] Modal quét giữ giá trị đã parse và mở form đã điền sẵn.
- [ ] Gọi API lưu báo cáo; hiển thị lỗi/thành công cho người dùng.

## P5 — Tabs, card và chỉnh sửa

- [ ] Tạo `ReportTabs` cho **Đã ra xưởng** và **Chưa ra xưởng**.
- [ ] Tạo `ReportCard` không dùng ảnh; hiển thị thông tin nhận diện, giờ vào/ra và cảnh báo thiếu dữ liệu.
- [ ] Tải danh sách theo ngày đã chọn và theo status.
- [ ] Trên card `pending`, hiện nút **Chỉnh sửa** khi hover/focus.
- [ ] Chỉnh sửa mở lại modal với dữ liệu cũ.
- [ ] Lưu với giờ ra hợp lệ thì card tự chuyển sang tab hoàn tất.

## P6 — Xuất Excel thủ công

- [ ] Hoàn thiện `services/excel-export.js` để xuất toàn bộ báo cáo của một ngày từ database.
- [ ] Xác nhận cách bố trí: một sheet hay hai sheet theo status.
- [ ] Tạo API xuất Excel theo ngày đang chọn.
- [ ] Đặt tên chuẩn `Báo cáo ddMMyyyyHHmmss.xlsx`.
- [ ] Chỉ đặt nút **Xuất Excel** ở màn hình danh sách, không đặt trong modal form.
- [ ] Kiểm tra template, format, merge cells, border và dữ liệu thiếu.

## P7 — Lịch sử và chống xuất trùng

- [ ] Tạo bảng `export_runs`.
- [ ] Lưu: ngày báo cáo, loại xuất (`manual`/`automatic`), thời điểm, tên file, trạng thái, lỗi và URL/đường dẫn file.
- [ ] Trước khi xuất tự động, kiểm tra đã có lượt xuất tự động thành công cho ngày đó chưa.
- [ ] Có cơ chế xuất bù nếu máy/service không hoạt động đúng 00:00.

## P8 — Chuyển cloud: Supabase + Render

- [ ] Tạo Supabase project và PostgreSQL schema tương ứng.
- [ ] Viết `supabase-report-repository` cùng interface với SQLite repository.
- [ ] Tạo Supabase Storage bucket `report-exports`.
- [ ] Đưa backend lên Render.
- [ ] Tạo Render Cron Job lúc `00:00` theo `Asia/Ho_Chi_Minh`.
- [ ] Job tạo Excel, tải file lên Supabase Storage và ghi `export_runs`.
- [ ] Dùng biến môi trường cho URL/key; tuyệt đối không commit secret.

## P9 — Chất lượng và vận hành

- [ ] Test parser, API tạo/sửa, chuyển trạng thái, export và chống trùng.
- [ ] Test tích hợp từ quét văn bản đến hiển thị đúng tab.
- [ ] Thêm logging có cấu trúc cho lỗi lưu/export/scheduler.
- [ ] Thêm backup, cảnh báo lỗi job và hướng dẫn phục hồi.
- [ ] Viết README tiếng Việt: chạy local, biến môi trường, migration, deploy và quy trình xử lý lỗi.

## Chưa thuộc phạm vi hiện tại

- [ ] Ảnh xe/CCCD/seal và Multer: giữ lại cho phase sau khi luồng báo cáo chính ổn định.
- [ ] PWA/offline draft: chỉ làm sau khi persistence và sync đã rõ ràng.
- [ ] Xác thực/phân quyền: thực hiện trước khi mở cho nhiều người dùng ngoài phạm vi nội bộ.

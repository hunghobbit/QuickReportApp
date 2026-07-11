# TODO

## 1. Đã hoàn thành gần đây

- [x] Việc ghi Excel không còn phụ thuộc vào file upload thủ công; endpoint viết record dùng template từ server.
- [x] Template Excel được load từ thư mục __xlsx/ và dùng để tạo workbook mới cho mỗi request.
- [x] Payload gửi lên có thể là tempRecord trực tiếp; backend đã map các trường như id, soCont/soSeal vào workbook.
- [x] Các trường thời gian và các trường thông tin chung đã được normalize để ghi vào Excel đúng dạng.

## 2. Cần làm tiếp (ưu tiên cao)

1. Harden validation cho payload.
   - Validate req.body.tempRecord trước khi parse JSON.
   - Thêm schema checks cho các trường bắt buộc và kiểu dữ liệu.
   - Chuẩn hóa thêm các alias khác nhau như id/cccd, soCont/soSeal.

2. Cải thiện xử lý lỗi và file I/O.
   - Tránh phụ thuộc vào path tạm cố định nếu có thể.
   - Dọn dẹp file tạm khi lỗi hoặc khi download bị ngắt.
   - Thêm logging rõ hơn cho các lỗi export.

3. Cải thiện UX ở frontend.
   - Hiển thị thông báo thành công/thất bại sau khi submit.
   - Cho phép nhập nhiều record trong cùng session trước khi export.

## 3. Kế hoạch trung hạn

1. Thêm database layer.
   - Dùng SQLite cho lưu trữ record.
   - Tạo bảng records với các cột phù hợp với model hiện tại.
   - Lưu mỗi record vào DB thay vì chỉ ghi Excel.

2. Tách riêng luồng nhập liệu và export.
   - Một endpoint lưu record.
   - Một endpoint tạo workbook từ dữ liệu đã lưu.

## 4. Cải tiến khác

1. PWA và mobile readiness.
   - Thêm service worker và manifest.
   - Làm app có thể cài đặt và dùng offline ở mức cơ bản.

2. Quản lý record nâng cao.
   - Thêm chức năng xem, sửa, xoá record.
   - Thêm filter theo ngày, ca, công ty.

3. Nâng cấp template Excel.
   - Giữ định dạng, border, merged cells và text tĩnh ổn định hơn.
   - Tạo filename export có timestamp.

4. Test coverage.
   - Thêm unit test cho validation và export Excel.
   - Thêm test cho parser/normalization.

## 5. Project housekeeping

1. Thêm README mô tả cách dùng và kiến trúc hiện tại.
2. Thêm linting/formatting nếu cần.
3. Bổ sung npm test và script dev phù hợp.

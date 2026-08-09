# Processing — QuickReportApp

> Cập nhật lần cuối: 2026-08-09
> Trạng thái: điều chỉnh theo Product Vision mới, ưu tiên ổn định luồng core

## Định hướng sản phẩm (đã chốt)

QuickReportApp được định hướng phát triển thành nền tảng hỗ trợ vận hành an ninh cổng nhà máy, không chỉ là công cụ xuất Excel.

Nguyên tắc quan trọng:

- C-TPAT là định hướng thiết kế và kiểm soát, không tự nhận là "C-TPAT certified".
- AI chỉ hỗ trợ trích xuất/gợi ý, không được bịa dữ liệu nghiệp vụ an ninh.
- Human verification là bắt buộc trước khi dữ liệu trở thành bản ghi chính thức.

## Core workflow hiện hành (ưu tiên ổn định)

Luồng đang vận hành:

Zalo report
→ copy raw text
→ upload images
→ AI phân tích text + ảnh
→ trích xuất dữ liệu có cấu trúc
→ người dùng review/chỉnh sửa
→ lưu database
→ export/report

Trọng tâm hiện tại:

- Ổn định luồng P0 trước khi mở rộng tính năng mới.
- Không rewrite kiến trúc hoặc thêm framework nếu chưa cần thiết.

## Tình trạng thực tế hiện có

- Frontend, backend, database, AI và export đã nối thành một luồng chạy được.
- Dữ liệu báo cáo đã có trạng thái pending/completed.
- Đã có AI multimodal (ảnh + text) và màn hình review trước khi lưu.

## Khung ưu tiên phát triển (P0 → P8)

- P0: Core functionality stability.
- P1: Data correctness and reliability.
- P2: Database/data model stability.
- P3: Record management and retrieval.
- P4: Audit trail.
- P5: Evidence management.
- P6: Access control.
- P7: Reporting and audit package.
- P8: Advanced security intelligence.

## Scope điều hành hiện tại

### In scope ngay bây giờ

- Sửa lỗi gây sai dữ liệu hoặc gián đoạn luồng tạo/sửa/lưu/xuất.
- Củng cố validation và chuẩn hóa dữ liệu đầu vào AI trước khi lưu.
- Tăng độ tin cậy truy xuất dữ liệu theo ngày/trạng thái và lịch sử export.
- Bổ sung test cho các hành vi nghiệp vụ cốt lõi.

### Out of scope khi chưa có yêu cầu riêng

- Không dựng module Vehicle/Visitor Management đầy đủ.
- Không dựng dashboard vận hành khi model dữ liệu chưa ổn định.
- Không thêm bảng speculative cho versioning/audit/evidence nếu chưa có task rõ ràng.
- Không thay đổi lớn kiến trúc chỉ để "đón đầu" roadmap.

## Các điểm kỹ thuật cần giữ khi sửa code

- Giữ tách lớp rõ ràng: UI, business logic, repository/database, AI processing, export.
- Tránh coupling chặt workflow hiện tại với riêng Excel.
- Ưu tiên backward compatibility cho dữ liệu và API đang dùng.
- Không silently overwrite dữ liệu quan trọng nếu có thể kiểm soát ở service layer.

## Technical debt cần theo dõi (để không chặn roadmap)

- Chưa có audit trail chuẩn cho field-level change (who/when/old/new/reason).
- Chưa có mô hình evidence liên kết chặt với event/record.
- Chưa có version history cho record quan trọng.
- Chưa có truy vết liên kết đầy đủ Vehicle ↔ Driver ↔ Container ↔ Seal ↔ Evidence.

## Ghi chú vận hành tài liệu

Tài liệu này theo dõi tiến độ thực tế và nguyên tắc ra quyết định kỹ thuật. Future roadmap là định hướng sản phẩm, không tự động biến thành task sprint hiện tại.

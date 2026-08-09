# AI-CONTEXT — AI Report Generator Module

> Cập nhật lần cuối: 2026-08-08
> Phạm vi: server/ai

## Tổng quan

Module AI dùng để tạo báo cáo từ ảnh và dữ liệu người dùng. Hiện tại hệ thống hỗ trợ cả mode text-only và multimodal image-based.

## Cấu trúc hiện tại

- server/ai/ai.service.js: gọi AI provider, xử lý retry, parse và validate output
- server/ai/buildInput.js: tạo prompt input và template báo cáo
- server/ai/report-parser.js: chuyển kết quả AI thành object báo cáo
- server/ai/validator.js: validate và tạo warnings
- server/ai/prompt.js: prompt hệ thống cho model

## Provider hỗ trợ

- Gemini: mặc định qua GEMINI_API_KEY hoặc GOOGLE_API_KEY
- OpenRouter: dùng khi AI_PROVIDER=openrouter và có OPENROUTER_API_KEY

## Các endpoint hiện có

- POST /api/ai/generate-report
- POST /api/ai/generate-report-from-images
- GET /api/ai/status

## Luồng hoạt động

1. Người dùng chọn ảnh hoặc nhập dữ liệu OCR.
2. Backend build prompt và gửi cho model.
3. AI trả về report text với các field.
4. Parser map dữ liệu sang cấu trúc report.
5. Validator tạo found/missing/warnings.
6. Frontend hiển thị kết quả và cho phép điền vào form lưu báo cáo.

## Điểm nổi bật

- Hỗ trợ Số cont
- Hỗ trợ CCCD mapping từ input OCR
- Hỗ trợ watermark khi chụp ảnh từ CameraCapture
- Hỗ trợ upload nhiều ảnh cùng lúc

---

*File này được cập nhật tự động — QuickReportApp AI Context*

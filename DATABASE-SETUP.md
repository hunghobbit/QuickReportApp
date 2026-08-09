# Database Setup Guide

## Tổng quan

QuickReportApp hiện dùng PostgreSQL qua Prisma. Tài liệu này mô tả cách thiết lập database, chạy migration và seed dữ liệu ban đầu.

## 1. Cài đặt PostgreSQL

Đảm bảo PostgreSQL đang chạy và có một database trống để dùng cho app.

Ví dụ với Docker:

```bash
docker run --name quickreport-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=quickreportapp -p 5432:5432 -d postgres:16
```

## 2. Cấu hình biến môi trường

Tạo file .env với nội dung:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/quickreportapp
JWT_SECRET=change-me
```

## 3. Chạy migration

```bash
npm run migrate
```

Lệnh này sẽ generate Prisma client và sync schema vào database.

## 4. Chạy seed data

```bash
node database/seed.js
```

Seed script tạo các user mặc định để test login.

## 5. Kiểm tra kết nối

```bash
npx prisma studio
```

## Cấu trúc database

- users: lưu account và team
- reports: lưu báo cáo và trạng thái
- export_runs: lưu lịch sử xuất Excel

## Lưu ý

- Nếu đổi schema, nên chạy migration lại.
- Không commit DATABASE_URL có thông tin nhạy cảm.

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

*Tài liệu này được tạo cho QuickReportApp - Phiên bản 1.0*.
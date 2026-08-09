# QuickReportApp - Ứng dụng Báo cáo Logistics

Ứng dụng giúp nhân viên tạo, chỉnh sửa và xuất báo cáo logistics theo ngày, với luồng phân loại pending/completed và tích hợp AI để tạo báo cáo từ ảnh chụp.

## Tính năng chính

- ✅ Tạo và chỉnh sửa báo cáo
- ✅ Phân loại UI theo pending/completed
- ✅ Xuất Excel theo ngày với 2 sheet
- ✅ Lưu lịch sử export vào database
- ✅ Auth cơ bản bằng JWT
- ✅ AI report generator từ ảnh
- ✅ Dữ liệu lưu trên PostgreSQL qua Prisma

## Công nghệ hiện tại

### Backend
- Node.js + Express
- PostgreSQL + Prisma
- ExcelJS
- JWT + bcryptjs
- Multer cho upload ảnh
- AI provider: Gemini/OpenRouter

### Frontend
- React 19 + Vite 8
- Tailwind CSS
- React Context

## Cài đặt nhanh

### Yêu cầu
- Node.js 18+
- PostgreSQL đang chạy
- npm

### 1. Cài đặt package

```bash
npm install
cd clients && npm install && cd ..
```

### 2. Cấu hình biến môi trường

Tạo file .env với các biến như:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/quickreportapp
JWT_SECRET=change-me
GEMINI_API_KEY=...
# hoặc OPENROUTER_API_KEY=...
```

### 3. Chạy migration và seed

```bash
npm run migrate
node database/seed.js
```

### 4. Khởi động app

```bash
npm run dev
```

Backend chạy ở http://localhost:3000
Frontend chạy ở http://localhost:3001

## Cấu trúc thư mục chính

```text
app.js
package.json
prisma/schema.prisma
database/
services/
server/ai/
clients/src/
configs/
storage/
```

## API chính

### Auth
- POST /api/auth/login
- GET /api/auth/me
- GET /api/users

### Reports
- POST /api/reports
- GET /api/reports?date=YYYY-MM-DD
- GET /api/reports/:id
- PUT /api/reports/:id

### Export
- GET /api/reports/export/:date
- GET /api/reports/export/history/:date

### AI
- POST /api/ai/generate-report
- POST /api/ai/generate-report-from-images
- GET /api/ai/status

## Luồng nghiệp vụ

1. Người dùng tạo báo cáo từ form hoặc AI.
2. Backend lưu báo cáo và tự tính status pending/completed theo gioRa.
3. UI hiển thị báo cáo ở đúng tab.
4. Người dùng có thể xuất Excel theo ngày.

## Ghi chú triển khai

- Schema dùng chung nằm ở configs/record-schema.js.
- AI flow hiện là một luồng chính khi tạo báo cáo mới.
- Dữ liệu export được lưu trong bảng export_runs để tránh duplicate export.

## Triển khai

- Với Render: dùng web service cho backend và frontend riêng.
- Với VPS: chạy backend bằng PM2 và frontend bằng Vite build hoặc reverse proxy.

---

*Cập nhật theo trạng thái hiện tại của codebase.*
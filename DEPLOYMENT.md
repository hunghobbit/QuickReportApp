# Deployment Guide

## Mục tiêu

Hướng dẫn triển khai QuickReportApp với backend Node/Express, frontend React/Vite, database PostgreSQL và AI provider.

## Yêu cầu môi trường

- Node.js 18+
- PostgreSQL 14+
- NPM
- Các biến môi trường:
  - DATABASE_URL
  - JWT_SECRET
  - GEMINI_API_KEY hoặc OPENROUTER_API_KEY

## Cấu hình môi trường

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret
GEMINI_API_KEY=...
PORT=3000
NODE_ENV=production
```

## Deploy backend

### Render

1. Tạo web service trên Render.
2. Chọn repo và branch.
3. Build command:
   ```bash
   npm install
   ```
4. Start command:
   ```bash
   npm run dev
   ```
5. Set env vars theo mục trên.
6. Chạy migration sau khi deploy:
   ```bash
   npm run migrate
   ```

### VPS / PM2

```bash
npm install
npm run migrate
pm2 start app.js --name quickreportapp
```

## Deploy frontend

Frontend có thể deploy riêng trên Vercel hoặc Netlify.

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: `clients`

## Lưu ý quan trọng

- Prisma cần DATABASE_URL hợp lệ trước khi chạy migration.
- Nếu dùng AI, phải đảm bảo provider key có sẵn trong production.
- Storage cho Excel export nên có quyền ghi.

## Troubleshooting

- Database connection failed: kiểm tra DATABASE_URL và PostgreSQL.
- AI endpoint lỗi: kiểm tra GEMINI_API_KEY hoặc OPENROUTER_API_KEY.
- Build frontend lỗi: kiểm tra dependency trong clients/package.json.

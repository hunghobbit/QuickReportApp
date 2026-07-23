# Hướng dẫn Deploy - Giải pháp Hybrid (Free Tier)

Hướng dẫn deploy ứng dụng lên cloud với chi phí $0/tháng.

## Tổng quan

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │      │    Render   │      │  SQLite     │
│  (Frontend) │─────▶│  (Backend)  │─────▶│  (Database) │
│  Free Tier  │      │  Free Tier  │      │  Disk 1GB   │
└─────────────┘      └─────────────┘      └─────────────┘
      │                     │
      │                     │
   Public URL          API URL
   your-app.vercel.app  quick-report-api.onrender.com
```

## Bước 1: Chuẩn bị Code

### 1.1. Cập nhật API URL cho production

Sửa `clients/src/utils/api.js`:

```javascript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://quick-report-api.onrender.com/api'  // Production URL
  : '/api';  // Development (Vite proxy)
```

### 1.2. Commit và push lên GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## Bước 2: Deploy Backend lên Render

### 2.1. Đăng ký Render

1. Truy cập https://render.com
2. Đăng ký bằng GitHub account
3. Xác thực email

### 2.2. Tạo Web Service

1. **New +** → **Web Service**
2. **Connect GitHub repo**:
   - Chọn repository `QuickReportApp`
   - Click **Connect**

3. **Cấu hình service**:
   ```
   Name: quick-report-api
   Runtime: Node
   Plan: Free
   Region: Singapore (gần Việt Nam nhất)
   ```

4. **Build & Deploy**:
   ```
   Build Command:
   npm install && cd clients && npm install && npm run build && cd ..
   
   Start Command:
   node app.js
   ```

5. **Disk Storage** (quan trọng):
   - Click **Add Disk**
   - Name: `quick-report-data`
   - Mount Path: `/opt/render/project/src/storage`
   - Size: 1 GB
   - Click **Attach**

6. **Environment Variables**:
   ```
   NODE_ENV = production
   PORT = 3000
   ```

7. **Create Web Service**
   - Đợi build hoàn thành (~2-3 phút)
   - Xem logs để đảm bảo không có lỗi

### 2.3. Lấy API URL

Sau khi deploy thành công:
```
API URL: https://quick-report-api.onrender.com
Health Check: https://quick-report-api.onrender.com/api/reports?date=2024-12-25
```

### 2.4. Test API

```bash
# Test get reports
curl https://quick-report-api.onrender.com/api/reports?date=2024-12-25

# Test export
curl -o test.xlsx https://quick-report-api.onrender.com/api/reports/export/2024-12-25
```

## Bước 3: Deploy Frontend lên Vercel

### 3.1. Đăng ký Vercel

1. Truy cập https://vercel.com
2. Đăng ký bằng GitHub account
3. Xác thực email

### 3.2. Import Project

1. **Add New...** → **Project**
2. **Import Git Repository**:
   - Chọn `QuickReportApp`
   - Click **Import**

3. **Configure Project**:
   ```
   Root Directory: clients
   Framework Preset: Vite (auto-detected)
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Environment Variables** (optional):
   ```
   NODE_ENV = production
   VITE_API_URL = https://quick-report-api.onrender.com/api
   ```

5. **Deploy**
   - Click **Deploy**
   - Đợi build hoàn thành (~1-2 phút)
   - Frontend URL: `https://your-project.vercel.app`

### 3.3. Cấu hình Custom Domain (optional)

1. **Settings** → **Domains**
2. Add domain: `report.yourdomain.com`
3. Follow instructions to update DNS

## Bước 4: Cấu hình CORS (nếu cần)

Nếu frontend và backend khác domain, cần cập nhật CORS trong `app.js`:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-project.vercel.app', 'https://report.yourdomain.com']
    : 'http://localhost:5173',
  credentials: true
}));
```

Push lại lên GitHub, Render sẽ auto-deploy.

## Bước 5: Test toàn bộ ứng dụng

### 5.1. Test Frontend

1. Truy cập: `https://your-project.vercel.app`
2. Chọn ngày báo cáo
3. Tạo báo cáo mới
4. Kiểm tra danh sách hiển thị đúng

### 5.2. Test Export

1. Click "Xuất Excel"
2. Kiểm tra file download đúng
3. Kiểm tra API history: `https://quick-report-api.onrender.com/api/reports/export/history/2024-12-25`

### 5.3. Test từ thiết bị khác

Truy cập URL từ điện thoại/tablet:
```
https://your-project.vercel.app
```

## Bước 6: Monitoring & Maintenance

### 6.1. Render Logs

```
Render Dashboard → quick-report-api → Logs
```

Xem logs real-time để debug issues.

### 6.2. Vercel Analytics

```
Vercel Dashboard → your-project → Analytics
```

Xem traffic, performance metrics.

### 6.3. Database Backup

**Tự động backup (khuyến nghị):**

Tạo script `scripts/backup-db.js`:
```javascript
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function backup() {
  const timestamp = new Date().toISOString().split('T')[0];
  const backupDir = path.join(process.cwd(), 'storage', 'backups');
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });
  
  // Copy database
  const dbPath = path.join(process.cwd(), 'storage', 'data', 'quick-report.db');
  const backupPath = path.join(backupDir, `quick-report-${timestamp}.db`);
  
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Keep only last 7 backups
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('quick-report-') && f.endsWith('.db'))
    .sort()
    .reverse();
  
  files.slice(7).forEach(file => {
    fs.unlinkSync(path.join(backupDir, file));
    console.log(`🗑️  Deleted old backup: ${file}`);
  });
}

backup().catch(console.error);
```

**Chạy backup hàng ngày trên Render:**

Thêm vào `render.yaml`:

```yaml
services:
  - type: web
    name: quick-report-api
    runtime: node
    plan: free
    buildCommand: npm install && cd clients && npm install && npm run build && cd ..
    startCommand: node app.js
    envVars:
      - key: NODE_ENV
        value: production
    disk:
      name: quick-report-data
      mountPath: /opt/render/project/src/storage
      sizeGB: 1
    schedules:
      - cron: "0 0 * * *"  # Daily at midnight UTC
        command: "node scripts/backup-db.js"
```

## Bước 7: Custom Domain (optional)

### 7.1. Mua domain

Mua domain tại:

- Namecheap: ~$10/năm
- GoDaddy: ~$15/năm
- Google Domains: ~$12/năm

### 7.2. Cấu hình DNS

**Vercel (Frontend):**
```
Type: A
Name: @
Value: 76.76.21.21 (Vercel IP)

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Render (Backend):**
```
Type: CNAME
Name: api
Value: quick-report-api.onrender.com
```

### 7.3. HTTPS

Vercel và Render tự động cấp HTTPS certificate miễn phí.

## Chi phí thực tế

| Service | Free Tier | Paid (nếu cần) |
|---------|-----------|----------------|
| Vercel (Frontend) | ✅ Free (100GB bandwidth) | $20/tháng (Pro) |
| Render (Backend) | ✅ Free (750 giờ/tháng) | $7/tháng (Starter) |
| Domain | ❌ | ~$10-15/năm |
| **TOTAL** | **$0/tháng** | **$7-27/tháng** |

## Troubleshooting

### Render: App bị sleep

**Triệu chứng:** First request sau 15 phút mất 30s để load

**Giải pháp:**
1. Dùng paid plan ($7/tháng) - không sleep
2. Hoặc dùng UptimeRobot ping định kỳ:
   ```
   https://uptimerobot.com
   Monitor: https://quick-report-api.onrender.com/api/reports?date=2024-12-25
   Interval: 10 minutes
   ```

### Vercel: 404 on refresh

**Nguyên nhân:** React Router không handle refresh

**Giải pháp:** Đã có `rewrites` trong `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### CORS Error

**Triệu chứng:** `Access-Control-Allow-Origin` error

**Giải pháp:**
1. Kiểm tra `app.js` CORS config
2. Kiểm tra frontend API URL đúng
3. Push lại lên GitHub để auto-deploy

### Database bị mất

**Nguyên nhân:** Render restart container

**Giải pháp:** 
- Đã mount disk 1GB (persistent)
- Kiểm tra disk mount path đúng: `/opt/render/project/src/storage`
- Setup backup script (Bước 6.3)

## Rollback

### Rollback Render

```
Render Dashboard → quick-report-api → Deploys → Chọn version cũ → Rollback
```

### Rollback Vercel

```
Vercel Dashboard → your-project → Deployments → Chọn version cũ → Promote to Production
```

## Next Steps

1. **P8**: Thêm automatic export với cron job
2. **P9**: Thêm authentication, backup automation, monitoring
3. **Scale**: Nếu cần, nâng cấp Render plan hoặc chuyển VPS

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Issues: Tạo issue trên GitHub repo

---

*Deploy thành công rồi nhớ share URL cho team nhé!* 🚀
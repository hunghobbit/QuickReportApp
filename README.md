# QuickReportApp - Ứng dụng Báo cáo Logistics

Ứng dụng giúp nhân viên bảo vệ chuyển nội dung báo cáo logistics thô (sao chép từ Zalo) thành báo cáo chuẩn và file Excel cuối ngày.

## Tính năng

- ✅ Tạo và chỉnh sửa báo cáo (draft/complete mode)
- ✅ Phân loại báo cáo: Chưa ra xưởng / Đã ra xưởng
- ✅ Xuất Excel theo ngày (2 sheet: pending + completed)
- ✅ Chống xuất trùng tự động (automatic export chỉ được phép 1 lần/ngày)
- ✅ Lịch sử xuất chi tiết
- ✅ Giao diện responsive (desktop + mobile)

## Công nghệ

### Backend
- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Database**: SQLite3 (WAL mode)
- **Excel**: ExcelJS
- **Logging**: Morgan

### Frontend
- **Framework**: React 18 + Vite
- **UI**: Tailwind CSS
- **State**: React Context + Hooks

## Cài đặt

### Yêu cầu
- Node.js >= 18.x
- npm hoặc yarn

### Backend

```bash
# 1. Clone repository
git clone <repository-url>
cd QuickReportApp

# 2. Cài đặt dependencies
npm install

# 3. Chạy migration (tạo database)
npm run migrate

# 4. Khởi động server
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

### Frontend

```bash
# 1. Vào thư mục clients
cd clients

# 2. Cài đặt dependencies
npm install

# 3. Khởi động dev server
npm run dev
```

Frontend sẽ chạy tại `http://localhost:5173` (hoặc port khác nếu 5173 bị chiếm)

## Cấu trúc dự án

```
QuickReportApp/
├── app.js                      # Express server - API endpoints
├── package.json                # Backend dependencies
├── configs/
│   ├── record-schema.js        # Schema, validation, normalization
│   └── worksheet-config.js     # Excel configuration
├── database/
│   ├── db.js                   # SQLite connection
│   ├── migrate.js              # Migration runner
│   ├── migrations/             # SQL migration files
│   │   ├── 001-create-reports-table.sql
│   │   └── 002-create-export-runs-table.sql
│   ├── sqlite-report-repository.js  # Reports CRUD
│   └── export-run-repository.js      # Export history CRUD
├── services/
│   ├── report-service.js       # Business logic layer
│   ├── report-status.js        # Status rules (pending/completed)
│   ├── record-validation.js    # Input validation (2 modes)
│   └── excel-export.js         # Excel generation
├── clients/                    # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/report/  # Report components
│   │   ├── contexts/           # React contexts
│   │   └── utils/              # API utilities
│   └── package.json
├── storage/
│   ├── data/                   # SQLite database file
│   └── reports/                # Generated Excel files
└── templates/
    └── Goods_Template.xlsx     # Excel template
```

## API Endpoints

### Reports

#### `POST /api/reports` - Tạo báo cáo mới
```json
{
  "reportDate": "2024-12-25",
  "stt": "1",
  "hoTen_ThuocCtyDonVi": "Nguyễn Văn A - Công ty ABC",
  "xuongGiao": "Xưởng 1",
  "xuongNhan": "Xưởng 2",
  "soThe": "12345",
  "businessId": "CMND-123456789",
  "loaiPhuongTien_BSX_BKSRomooc": "Xe tải - 30A-12345",
  "soCont_SoSeal": "CONT-001 - SEAL-001",
  "chiTietHangHoa": "Hàng hóa A - 100kg",
  "soPhieu": "PH-001",
  "gioVao": "08:00",
  "gioRa": "17:00",
  "ghiChu": "Ghi chú",
  "rawText": "Zalo text..."
}
```

**Response**: `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "reportDate": "2024-12-25",
    "status": "completed",
    ...
  }
}
```

#### `GET /api/reports?date=YYYY-MM-DD` - Danh sách báo cáo theo ngày
**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "reportDate": "2024-12-25",
      "status": "completed",
      ...
    }
  ]
}
```

#### `GET /api/reports/:id` - Chi tiết báo cáo
**Response**: `200 OK` hoặc `404 Not Found`

#### `PUT /api/reports/:id` - Cập nhật báo cáo
```json
{
  "stt": "2",
  "gioRa": "18:00",
  ...
}
```

**Response**: `200 OK` hoặc `404 Not Found`

### Export

#### `GET /api/reports/export/:date` - Xuất Excel
Xuất file Excel chứa báo cáo của ngày được chỉ định.

**Response**: `200 OK` (file download) hoặc `404 Not Found`

#### `GET /api/reports/export/history/:date` - Lịch sử xuất theo ngày
**Response**: `200 OK`
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
      "status": "success"
    }
  ]
}
```

#### `GET /api/reports/export/history?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Lịch sử xuất theo khoảng ngày
**Response**: `200 OK`

## Validation Rules

### Draft Mode (Lưu tạm)
- Không yêu cầu `gioRa`
- Tất cả các trường khác bắt buộc
- Status: `pending`

### Complete Mode (Hoàn tất)
- Yêu cầu tất cả các trường bao gồm `gioRa`
- `gioRa` phải hợp lệ (HH:MM)
- Status: `completed` nếu `gioRa` hợp lệ, ngược lại `pending`

### Time Format
- Hỗ trợ: `HH:MM`, `H:MM`, `HH.MM`, `HH:MM:SS`
- Range: 00:00 - 23:59
- Auto-padding: `7:5` → `07:05`

## Export Rules

### Manual Export
- Có thể xuất nhiều lần cho cùng một ngày
- Mỗi lần xuất tạo file mới với timestamp
- Lưu lịch sử với `export_type = "manual"`

### Automatic Export (P8 - Scheduler)
- Chỉ được phép xuất 1 lần thành công cho mỗi ngày
- Nếu đã có lượt `automatic` thành công → từ chối xuất trùng
- Lưu lịch sử với `export_type = "automatic"`

## Database Schema

### Bảng `reports`
Lưu trữ báo cáo nghiệp vụ.

### Bảng `export_runs`
Lưu lịch sử các lần xuất Excel.

```sql
- id: INTEGER PRIMARY KEY
- report_date: TEXT (YYYY-MM-DD)
- export_type: TEXT (manual | automatic)
- exported_at: TEXT (ISO 8601)
- file_name: TEXT
- file_path: TEXT
- status: TEXT (success | failed)
- error_message: TEXT
- created_at: TEXT (ISO 8601)
```

## Development

### Scripts

```bash
# Backend
npm run dev          # Start dev server with nodemon
npm run start        # Same as dev
npm run test         # Run tests (vitest)
npm run migrate      # Run database migrations

# Frontend (in clients/)
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Environment Variables

Dự án sử dụng file `.env` để quản lý biến môi trường. File `.env.example` cung cấp template với tất cả các biến cần thiết.

#### Các biến môi trường chính:

```env
# Server Configuration
PORT=3000                    # Port chạy server (default: 3000)
NODE_ENV=development         # Môi trường: development | production

# Database Configuration
DB_PATH=storage/data/quick-report.db  # Đường dẫn đến file SQLite database

# File Paths Configuration
TEMPLATE_DIR=templates               # Thư mục chứa Excel templates
EXPORT_DIR=storage/reports           # Thư mục xuất Excel reports

# Optional: CORS Configuration
# CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Optional: Logging
# LOG_LEVEL=info
```

#### Sử dụng:

1. **Local Development:**
   ```bash
   # Copy template
   cp .env.example .env
   
   # Chỉnh sửa nếu cần
   notepad .env
   ```

2. **Production (Render):**
   - Các biến được cấu hình trong `render.yaml`
   - Hoặc set trực tiếp trong Render Dashboard → Environment Variables

3. **Production (VPS/PM2):**
   ```bash
   # Set environment variables
   export PORT=3000
   export NODE_ENV=production
   
   # Hoặc dùng .env file với PM2
   pm2 start app.js --name quick-report --env production
   ```

#### Lưu ý:
- File `.env` không được commit lên Git (đã có trong `.gitignore`)
- File `.env.example` là template công khai, có thể commit
- Trong production, nên set biến môi trường trực tiếp thay vì dùng file `.env`

## Deployment

### Giải pháp Hybrid (Khuyến nghị) - $0/tháng

Deploy backend lên Render (free tier) và frontend lên Vercel (free tier).

### Phương án 1: Self-hosted (Miễn phí)

**Phù hợp:** Internal use, team nhỏ, chạy trên máy local hoặc VPS

#### Trên máy local:

1. **Clone và cài đặt**
```bash
git clone <repository-url>
cd QuickReportApp
npm install
cd clients && npm install && cd ..
```

2. **Chạy migration**
```bash
npm run migrate
```

3. **Build frontend**
```bash
cd clients
npm run build
cd ..
```

4. **Khởi động với PM2**
```bash
npm install -g pm2
pm2 start app.js --name quick-report
pm2 save
pm2 startup
```

5. **Truy cập từ thiết bị khác**

**Cùng mạng WiFi:**
```bash
# Tìm IP của máy (Windows)
ipconfig

# Truy cập từ thiết bị khác
http://192.168.1.100:3000  # Thay bằng IP thực tế
```

**Mở firewall:**
```bash
# Windows Firewall
netsh advfirewall firewall add rule name="QuickReportApp" dir=in action=allow protocol=TCP localport=3000
```

**Từ internet (port forwarding):**
1. Đăng nhập router (192.168.1.1)
2. Port Forwarding: External Port 3000 → Internal IP: 3000
3. Truy cập: `http://<public-ip>:3000`

---

### Phương án 2: Cloud Hybrid (Free Tier) - $0/tháng

**Phù hợp:** Cần public access, không muốn cấu hình router

#### Backend: Deploy lên Render

1. **Push code lên GitHub**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

2. **Đăng ký Render.com** (https://render.com)

3. **Tạo Web Service**
   - New + → Web Service
   - Connect GitHub repo
   - Config:
     - **Name**: `quick-report-api`
     - **Runtime**: `Node`
     - **Plan**: `Free`
     - **Build Command**: 
       ```bash
       npm install && cd clients && npm install && npm run build && cd ..
       ```
     - **Start Command**: `node app.js`
     - **Disk**: Add disk named `quick-report-data`, mount path `/opt/render/project/src/storage`, size 1GB

4. **Environment Variables** (optional)
   - `NODE_ENV` = `production`
   - `PORT` = `3000` (Render tự động set)

5. **Deploy**
   - Click "Create Web Service"
   - Đợi build hoàn thành (~2-3 phút)
   - API URL: `https://quick-report-api.onrender.com`

#### Frontend: Deploy lên Vercel

1. **Đăng ký Vercel.com** (https://vercel.com)

2. **Import project**
   - New Project → Import GitHub repo
   - Root Directory: `clients`
   - Framework: Vite (auto-detect)

3. **Config**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Frontend URL: `https://your-project.vercel.app`

5. **Cấu hình API proxy (optional)**
   - Nếu frontend và backend khác domain, cần sửa `clients/vite.config.js`:
   ```js
   export default defineConfig({
     server: {
       proxy: {
         '/api': {
           target: 'https://quick-report-api.onrender.com',
           changeOrigin: true,
         }
       }
     }
   })
   ```

#### Cập nhật API URL trong frontend

Sửa `clients/src/utils/api.js`:
```javascript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://quick-report-api.onrender.com/api'  // Production
  : '/api';  // Development
```

---

### Phương án 3: VPS ($3-5/tháng)

**Phù hợp:** Cần ổn định cao, nhiều traffic

#### Providers:
- DigitalOcean: $4/tháng (1GB RAM, 25GB SSD)
- Vultr: $2.5/tháng (512MB RAM)
- Linode: $5/tháng (1GB RAM)

#### Setup:

```bash
# 1. SSH vào VPS
ssh root@<vps-ip>

# 2. Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repo
git clone <repository-url>
cd QuickReportApp
npm install
cd clients && npm install && npm run build && cd ..

# 4. Cài PM2
npm install -g pm2

# 5. Start app
pm2 start app.js --name quick-report
pm2 save
pm2 startup

# 6. Cài Nginx
sudo apt install nginx certbot

# 7. Cấu hình Nginx (/etc/nginx/sites-available/quick-report)
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /path/to/QuickReportApp/clients/dist;
        try_files $uri $uri/ /index.html;
    }
}

# 8. Enable HTTPS với Let's Encrypt
sudo certbot --nginx
```

---

## So sánh các phương án

| Tiêu chí | Self-hosted | Hybrid (Free) | VPS |
|-----------|-------------|---------------|-----|
| Chi phí | $0 | $0 | $3-5/tháng |
| Public access | Cần port forwarding | ✅ Có sẵn | ✅ Có sẵn |
| HTTPS | ❌ Không | ✅ Miễn phí | ✅ Miễn phí |
| Ổn định | Phụ thuộc internet nhà | 99.9% uptime | 99.9% uptime |
| Database | SQLite local | SQLite file | SQLite local |
| Maintenance | Thấp | Thấp | Trung bình |
| Phù hợp | Internal, testing | Team distributed | Production |

---

## Khuyến nghị

### Giai đoạn hiện tại (Testing/Internal):
→ **Self-hosted** - Chạy trên máy local, truy cập cùng mạng

### Khi cần public access:
→ **Hybrid Free Tier** - Render + Vercel, $0/tháng

### Khi cần ổn định cao:
→ **VPS $3-5/tháng** - Toàn quyền kiểm soát

---

## Troubleshooting

### Render: App bị sleep
- Free tier tự động sleep sau 15 phút không có request
- Cold start ~30s khi có request mới
- **Giải pháp:** Dùng paid plan ($7/tháng) hoặc ping định kỳ

### Vercel: API calls fail
- Kiểm tra CORS đã được cấu hình trong `app.js`
- Kiểm tra API URL đúng trong production

### Database: File bị mất trên Render
- Render có thể restart container, nhưng disk được mount nên file được persist
- Kiểm tra disk đã mount đúng path trong `render.yaml`

### Port đã được sử dụng
```bash
# Thay đổi port
PORT=3001 npm run dev

# Hoặc kill process cũ
npx kill-port 3000
```

## Troubleshooting

### Database bị lock
- SQLite sử dụng WAL mode, nhưng nếu gặp lỗi lock, kiểm tra xem có process nào đang giữ connection không
- Restart server để giải phóng lock

### Export bị lỗi
- Kiểm tra template file `templates/Goods_Template.xlsx` có tồn tại không
- Kiểm tra thư mục `storage/reports/` có quyền ghi không
- Xem logs trong console để biết chi tiết lỗi

### Frontend không kết nối được API
- Kiểm tra backend đã chạy trên port 3000 chưa
- Kiểm tra Vite proxy config trong `clients/vite.config.js`
- Mở browser DevTools → Network tab để xem request

## License

MIT

## Author

hunghobbit

---

*Phát triển bởi đội ngũ DTA - 2024*
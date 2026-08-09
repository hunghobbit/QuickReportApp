# CONFIGS-CONTEXT — Configuration Files

> **Cập nhật lần cuối:** 28/07/2026
> **Phạm vi:** `configs/` + cấu hình dự án

---

## Tổng quan

Thư mục `configs/` chứa các file cấu hình chung được chia sẻ giữa frontend và backend. Đây là "nguồn dữ liệu chung duy nhất" (single source of truth) cho tên trường, nhãn, alias, chuẩn hóa và mapping Excel.

### Cấu trúc thư mục

```text
configs/
├── record-schema.js          # Schema, validation, normalization (380 lines)
└── worksheet-config.js       # Excel worksheet configuration

# Cấu hình dự án (root)
├── package.json              # Backend dependencies
├── prisma.config.js          # Prisma 7 config
├── render.yaml               # Render deployment
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── tree.ps1                  # PowerShell tree script
└── .vscode/settings.json     # VS Code settings

# Cấu hình frontend
clients/
├── package.json              # Frontend dependencies
├── vite.config.js            # Vite config
├── tailwind.config.js        # Tailwind CSS config
├── jsconfig.json             # JavaScript config
├── vercel.json               # Vercel deployment
├── postcss.config.mjs        # PostCSS config
└── .gitignore                # Frontend git ignore
```

---

## configs/record-schema.js (380 dòng)

### Mục đích

Là nguồn dữ liệu chung duy nhất cho:
- Tên trường chuẩn (FIELD_NAMES)
- Nhãn hiển thị tiếng Việt (LABELS)
- Alias tìm kiếm cho parser (TEXT_ALIASES)
- Danh sách trường form (FORM_FIELDS)
- Trường bắt buộc khi lưu tạm (REQUIRED_DRAFT_FIELDS)
- Trường bắt buộc khi lưu hoàn tất (REQUIRED_COMPLETE_FIELDS)
- Các trường thời gian (TIME_FIELDS)
- Mapping trường → cột Excel (EXCEL_COLUMNS)
- Header Excel (EXCEL_HEADERS)
- Hàm chuẩn hóa dữ liệu (normalizeRecord)
- Hàm chuẩn hóa giờ (normalizeTime)

### FIELD_NAMES

Tên trường chuẩn (được dùng trong cả frontend và backend):

| Tên trường | Mô tả |
|------------|-------|
| stt | Số thứ tự |
| hoTen | Họ tên |
| thuocCtyDonVi | Công ty/đơn vị |
| xuongGiao | Xưởng giao |
| xuongNhan | Xưởng nhận |
| soThe | Số thẻ |
| loaiPhuongTien | Loại phương tiện |
| bks | Biển số xe |
| bksRomooc | BKS rơmooc |
| soCont | Số cont |
| soSeal | Số seal |
| chiTietHangHoa | Chi tiết hàng hóa |
| soPhieu | Số phiếu |
| gioVao | Giờ vào |
| gioRa | Giờ ra |
| ghiChu | Ghi chú |

### LABELS

Nhãn hiển thị tiếng Việt cho từng trường:

| Tên trường | Nhãn |
|------------|------|
| stt | Số thứ tự |
| hoTen | Họ tên |
| thuocCtyDonVi | Công ty/Đơn vị |
| xuongGiao | Xưởng giao |
| xuongNhan | Xưởng nhận |
| soThe | Số thẻ |
| loaiPhuongTien | Loại phương tiện |
| bks | Biển số |
| bksRomooc | BKS rơmooc |
| soCont | Số cont |
| soSeal | Số seal |
| chiTietHangHoa | Chi tiết hàng hóa |
| soPhieu | Số phiếu |
| gioVao | Giờ vào |
| gioRa | Giờ ra |
| ghiChu | Ghi chú |

### TEXT_ALIASES

Alias tìm kiếm cho parser. Mỗi alias ánh xạ từ từ khóa tìm kiếm sang tên trường chuẩn:

| Từ khóa | Trường |
|---------|--------|
| "họ tên", "họ và tên", "tên" | hoTen |
| "công ty", "đơn vị" | thuocCtyDonVi |
| "xưởng giao", "giao hàng" | xuongGiao |
| "xưởng nhận", "nhận hàng" | xuongNhan |
| "số thẻ", "thẻ" | soThe |
| "loại phương tiện", "loại xe" | loaiPhuongTien |
| "biển số", "bks", "biển số xe" | bks |
| "bks rơmooc", "rơmooc" | bksRomooc |
| "số cont", "cont" | soCont |
| "số seal", "seal" | soSeal |
| "chi tiết hàng hóa", "chi tiết hàng", "hàng hóa" | chiTietHangHoa |
| "số phiếu", "phiếu" | soPhieu |
| "giờ vào", "vào" | gioVao |
| "giờ ra", "ra" | gioRa |
| "ghi chú", "ghi chú" | ghiChu |
| "số thứ tự", "stt" | stt |

### FORM_FIELDS

Danh sách trường hiển thị trong form (theo thứ tự):

```js
["stt", "hoTen", "thuocCtyDonVi", "xuongGiao", "xuongNhan", "soThe",
 "loaiPhuongTien", "bks", "bksRomooc", "soCont", "soSeal",
 "chiTietHangHoa", "soPhieu", "gioVao", "gioRa", "ghiChu"]
```

### REQUIRED_DRAFT_FIELDS

Trường bắt buộc khi lưu tạm (pending) — tất cả trừ `gioRa`:

```js
["stt", "xuongGiao", "xuongNhan", "soThe", "chiTietHangHoa", "soPhieu", "gioVao"]
```

### REQUIRED_COMPLETE_FIELDS

Trường bắt buộc khi lưu hoàn tất (completed) — tất cả bao gồm `gioRa`:

```js
["stt", "xuongGiao", "xuongNhan", "soThe", "chiTietHangHoa", "soPhieu", "gioVao", "gioRa"]
```

### TIME_FIELDS

Các trường thời gian:

```js
["gioVao", "gioRa"]
```

### EXCEL_COLUMNS

Mapping trường → cột Excel:

| Trường | Cột |
|--------|-----|
| stt | A |
| hoTen | B |
| thuocCtyDonVi | C |
| xuongGiao | D |
| xuongNhan | E |
| soThe | F |
| loaiPhuongTien | G |
| bks | H |
| bksRomooc | I |
| soCont | J |
| soSeal | K |
| chiTietHangHoa | L |
| soPhieu | M |
| gioVao | N |
| gioRa | O |
| ghiChu | P |

### EXCEL_HEADERS

Header Excel (tiếng Việt):

```js
["STT", "Họ tên", "Công ty", "Xưởng giao", "Xưởng nhận", "Số thẻ",
 "Loại xe", "Biển số", "BKS rơmooc", "Số cont", "Số seal",
 "Chi tiết hàng", "Số phiếu", "Giờ vào", "Giờ ra", "Ghi chú"]
```

### Hàm normalizeTime(time)

- **Input**: `time` (string) — Thời gian dạng `HH:MM`, `H:MM`, `HH.MM`, `HH:MM:SS`
- **Output**: `string` — Thời gian chuẩn `HH:MM`
- **Logic**:
  1. Nếu rỗng/null/undefined → trả về `""`
  2. Tách giờ và phút bằng regex
  3. Padding số 0 nếu cần: `7:5` → `07:05`
  4. Validate range: giờ 00-23, phút 00-59
  5. Trả về `HH:MM`

### Hàm normalizeRecord(record)

- **Input**: `record` (object) — Dữ liệu báo cáo
- **Output**: `object` — Dữ liệu đã chuẩn hóa
- **Logic**:
  1. Chuẩn hóa `gioVao` và `gioRa` bằng `normalizeTime`
  2. Trim whitespace cho tất cả string fields
  3. Trả về object mới

---

## configs/worksheet-config.js

### Mục đích

Cấu hình worksheet Excel: tên sheet, thứ tự cột, header.

### Nội dung

```js
export const WORKSHEET_CONFIG = {
  sheets: {
    pending: {
      name: "Chưa ra xưởng",
      status: "pending",
    },
    completed: {
      name: "Đã ra xưởng",
      status: "completed",
    },
  },
  columns: [
    { key: "stt", header: "STT", width: 8 },
    { key: "hoTen", header: "Họ tên", width: 20 },
    { key: "thuocCtyDonVi", header: "Công ty", width: 20 },
    { key: "xuongGiao", header: "Xưởng giao", width: 15 },
    { key: "xuongNhan", header: "Xưởng nhận", width: 15 },
    { key: "soThe", header: "Số thẻ", width: 12 },
    { key: "loaiPhuongTien", header: "Loại xe", width: 12 },
    { key: "bks", header: "Biển số", width: 15 },
    { key: "bksRomooc", header: "BKS rơmooc", width: 15 },
    { key: "soCont", header: "Số cont", width: 12 },
    { key: "soSeal", header: "Số seal", width: 12 },
    { key: "chiTietHangHoa", header: "Chi tiết hàng", width: 30 },
    { key: "soPhieu", header: "Số phiếu", width: 15 },
    { key: "gioVao", header: "Giờ vào", width: 10 },
    { key: "gioRa", header: "Giờ ra", width: 10 },
    { key: "ghiChu", header: "Ghi chú", width: 25 },
  ],
};
```

---

## Cấu hình dự án

### package.json (Backend)

```json
{
  "name": "quick-report-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node app.js",
    "dev": "node app.js",
    "migrate": "node database/migrate.js",
    "seed": "node database/seed.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@prisma/client": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "exceljs": "^4.4.0",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "prisma": "^7.0.0",
    "vitest": "^3.0.0"
  }
}
```

### prisma.config.js

```js
import { defineConfig } from "prisma/config";

export default defineConfig({
  // Prisma 7 configuration
});
```

### render.yaml

```yaml
services:
  - type: web
    name: quick-report-api
    runtime: node
    buildCommand: "npm install && npx prisma generate && npx prisma db push"
    startCommand: "node app.js"
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: quick-report-db
          property: connectionString
      - key: JWT_SECRET
        value: your_jwt_secret_key
    healthCheckPath: /health

databases:
  - name: quick-report-db
    region: singapore
    plan: free

cron:
  - name: daily-export
    schedule: "0 0 * * *"
    command: "node scripts/daily-export.js"
    timezone: "Asia/Ho_Chi_Minh"
```

### .env.example

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/quickreport?schema=public

# Auth
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Storage
REPORTS_STORAGE_PATH=./storage/reports

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# AI Report Generator (Google Gemini)
# Get your API key from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL=gemini-2.5-flash
```

### .gitignore

```gitignore
node_modules
.env
.env.local
.env.production
.ps1
TODO.md
storage/data/*.db
storage/reports/*
!storage/data/.gitkeep
!storage/reports/.gitkeep
database/generated/*
```

### tree.ps1

PowerShell script để hiển thị cấu trúc thư mục:

```powershell
param(
    [string]$Path = ".",
    [int]$Depth = 3
)
# ... logic tree
```

### .vscode/settings.json

```json
{
    "prisma.pinToPrisma6": true
}
```

---

## Frontend Configuration

### clients/package.json

```json
{
  "name": "quick-report-client",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --fix"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "axios": "^1.7.0",
    "joi": "^17.13.0",
    "lucide-react": "^0.400.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.25.0",
    "tailwindcss": "^4.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "postcss": "^8.4.0",
    "vite": "^8.0.0"
  }
}
```

### clients/vite.config.js

```js
import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

const ENV_NODE = process.env.NODE_ENV;
const devProxy = {
  "/api": {
    target: "http://localhost:3000",
    changeOrigin: true,
  },
};
const prodProxy = {
  "/api": {
    target: "https://quick-report-api.onrender.com",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: ENV_NODE === "development" ? devProxy : prodProxy,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/"),
      "_#": path.resolve(__dirname, "../")
    }
  }
});
```

### clients/tailwind.config.js

```js
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false,
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
```

### clients/jsconfig.json

```json
{
  "$schema": "https://www.schemastore.org/jsconfig",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "target": "ES6",
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "_#/*": ["../*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "src/lib/utils.js", "src/"],
  "exclude": ["node_modules"]
}
```

### clients/vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "source": "/api/((?!general).*)",
      "destination": "https://quick-report-api.onrender.com/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/$1"
    }
  ]
}
```

### clients/postcss.config.mjs

```js
import tailwind from '@tailwindcss/postcss';

export default {
  plugins: [
    tailwind,
  ],
};
```

---

*File này được cập nhật tự động — QuickReportApp Configs Context*

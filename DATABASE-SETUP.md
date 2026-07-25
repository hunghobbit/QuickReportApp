# Hướng dẫn Setup Database & Multi-User System

## 📋 Mục lục

1. [Tổng quan](#tổng-quan)
2. [Chạy Seed Data](#chạy-seed-data)
3. [Quản lý Users](#quản-lý-users)
4. [Luồng hoạt động](#luồng-hoạt-động)
5. [Test Cases](#test-cases)

---

## Tổng quan

Hệ thống hỗ trợ **2 người dùng** với phân quyền theo team:

- **Đội ELA** (team: "ELA")
- **Đội DTA** (team: "DTA")

Mỗi user có:

- Tên đăng nhập duy nhất
- Mật khẩu (được hash bằng bcrypt)
- Team (ELA hoặc DTA)

### Phân biệt báo cáo theo loại

Khi quét báo cáo thô, hệ thống tự động phân biệt:

- **Hàng Nhập (Import)**: Từ khóa "Hàng Nhập", "Hàng nhập", "import"
  - Tự động điền: **Xưởng Nhận** = Team của user (ELA/DTA)
  
- **Hàng Xuất (Export)**: Từ khóa "Hàng Xuất", "Hàng xuất", "export"
  - Tự động điền: **Xưởng Xuất** = Team của user (ELA/DTA)

---

## Chạy Seed Data

### Bước 1: Đảm bảo database đã chạy

```bash
# Kiểm tra PostgreSQL đang chạy
# Nếu dùng Docker:
docker ps | grep postgres

# Hoặc kiểm tra service
# Windows:
Get-Service postgresql*

# Mac/Linux:
sudo systemctl status postgresql
```

### Bước 2: Chạy migration (nếu chưa chạy)

```bash
# Tạo Prisma client và sync schema
node database/migrate.js
```

Output mong đợi:

```
✅ Prisma schema đã được generate
✅ Database đã được push
```

### Bước 3: Chạy seed script

```bash
node database/seed.js
```

Output mong đợi:
```
🌱 Bắt đầu seed data...

✅ Đã tạo user: Đội ELA (Team: ELA, ID: 1)
✅ Đã tạo user: Đội DTA (Team: DTA, ID: 2)

📋 Danh sách users hiện tại:
   - [1] Đội ELA (ELA) - 2026-07-25T...
   - [2] Đội DTA (DTA) - 2026-07-25T...

✅ Seed data hoàn thành!
```

### Bước 4: Verify users đã được tạo

```bash
# Chạy lại seed script để xem danh sách
node database/seed.js
```

Nếu users đã tồn tại, script sẽ bỏ qua và hiển thị danh sách:
```
⚠️  User "Đội ELA" đã tồn tại (ID: 1). Bỏ qua.
⚠️  User "Đội DTA" đã tồn tại (ID: 2). Bỏ qua.

📋 Danh sách users hiện tại:
   - [1] Đội ELA (ELA) - 2026-07-25T...
   - [2] Đội DTA (DTA) - 2026-07-25T...

✅ Seed data hoàn thành!
```

---

## Quản lý Users

### Đăng nhập

**API Endpoint:** `POST /api/auth/login`

**Request:**

```json
{
  "name": "Đội ELA",
  "password": "ela123456"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "Đội ELA",
      "team": "ELA"
    }
  }
}
```

### Lấy thông tin user hiện tại

**API Endpoint:** `GET /api/auth/me`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Đội ELA",
    "team": "ELA"
  }
}
```

### Lấy danh sách tất cả users

**API Endpoint:** `GET /api/users`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Đội ELA",
      "team": "ELA",
      "createdAt": "2026-07-25T..."
    },
    {
      "id": 2,
      "name": "Đội DTA",
      "team": "DTA",
      "createdAt": "2026-07-25T..."
    }
  ]
}
```

### Tạo user mới (Admin only)

**API Endpoint:** `POST /api/users` (cần implement)

Hoặc dùng trực tiếp Prisma Studio:

```bash
npx prisma studio
```

---

## Luồng hoạt động

### 1. User đăng nhập

```
Frontend → POST /api/auth/login
  ↓
Backend: auth-service.js → login()
  ↓
Prisma: Tìm user theo name
  ↓
So sánh password hash với bcrypt
  ↓
Tạo JWT token (chứa id, name, team)
  ↓
Trả về token + user info
```

### 2. Tạo báo cáo mới

```
Frontend → POST /api/reports (với token)
  ↓
Middleware: optionalAuth → gắn req.user
  ↓
Backend: report-service.js → createReport()
  ↓
  ├─ Validate payload
  ├─ Detect reportType từ rawText
  ├─ Auto-fill xưởng dựa trên team:
  │   ├─ Import → xuongNhan = user.team
  │   └─ Export → xuongGiao = user.team
  └─ Lưu vào DB với userId
```

### 3. Xuất Excel

```
Frontend → GET /api/reports/export/:date
  ↓
Backend: excel-export.js → exportDayReport()
  ↓
Lấy tất cả reports trong ngày
  ↓
Phân loại pending/completed
  ↓
Ghi vào Excel:
  ├─ Nếu field trống → "Không"
  └─ Nếu có giá trị → giữ nguyên
  ↓
Trả về file .xlsx
```

---

## Test Cases

### Test Case 1: Đội ELA tạo báo cáo Hàng Nhập

**Setup:**

- User: Đội ELA (team: "ELA")
- Raw text: "Hàng Nhập - ..."

**Expected:**

- `reportType`: "import"
- `xuongNhan`: "ELA"
- `xuongGiao`: "" (trống)
- `userId`: ID của Đội ELA

### Test Case 2: Đội DTA tạo báo cáo Hàng Xuất

**Setup:**

- User: Đội DTA (team: "DTA")
- Raw text: "Hàng Xuất - ..."

**Expected:**

- `reportType`: "export"
- `xuongGiao`: "DTA"
- `xuongNhan`: "" (trống)
- `userId`: ID của Đội DTA

### Test Case 3: Không có user (anonymous)

**Setup:**

- Không gửi token
- Raw text: "Hàng Nhập - ..."

**Expected:**

- `reportType`: "import"
- `xuongNhan`: "" (không auto-fill)
- `xuongGiao`: "" (trống)
- `userId`: null

### Test Case 4: Excel Export với giá trị trống

**Setup:**

- Report có `xuongGiao = ""`, `xuongNhan = "ELA"`, `ghiChu = ""`

**Expected trong Excel:**

- Cột "Xưởng Giao": "Không"
- Cột "Xưởng Nhận": "ELA"
- Cột "Ghi chú": "Không"

### Test Case 5: Cập nhật báo cáo

**Setup:**

- User Đội ELA cập nhật báo cáo của Đội DTA
- Thay đổi `xuongNhan` thành "DTA"

**Expected:**

- Auto-fill không ghi đè (vì đã có giá trị)
- `xuongNhan` = "DTA" (giữ nguyên giá trị user nhập)

---

## 🔒 Bảo mật

### Mật khẩu mặc định

**⚠️ QUAN TRỌNG:** Thay đổi mật khẩu mặc định sau khi deploy!

```bash
# Đổi mật khẩu qua Prisma Studio
npx prisma studio
# → Chọn User → Edit passwordHash
```

Hoặc tạo endpoint đổi mật khẩu trong API.

### JWT Secret

Đảm bảo `JWT_SECRET` trong `.env` là mạnh và không commit vào git:

```env
JWT_SECRET=your-very-secure-secret-key-here-at-least-32-chars
```

### Production

- Sử dụng HTTPS
- Set `NODE_ENV=production`
- Enable CORS chỉ cho domain frontend
- Rotate JWT_SECRET định kỳ

---

## 🐛 Troubleshooting

### Lỗi: "User already exists"

**Nguyên nhân:** Seed script đã chạy trước đó.

**Giải pháp:** Bỏ qua, users đã tồn tại. Hoặc xóa users trong Prisma Studio và chạy lại.

### Lỗi: "Cannot find module"

**Nguyên nhân:** Thiếu dependencies.

**Giải pháp:**

```bash
npm install
```

### Lỗi: "Database connection failed"

**Nguyên nhân:** PostgreSQL chưa chạy hoặc DATABASE_URL sai.

**Giải pháp:**

1. Kiểm tra PostgreSQL đang chạy
2. Kiểm tra `.env` có `DATABASE_URL` đúng không
3. Test connection:

   ```bash
   node -e "const {getPrisma}=require('./database/prisma-client.js'); getPrisma().\$connect().then(()=>console.log('✅ Connected')).catch(e=>console.error('❌',e))"
   ```

---

## 📚 Tham khảo

- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

*Tài liệu này được tạo cho QuickReportApp - Phiên bản 1.0*.
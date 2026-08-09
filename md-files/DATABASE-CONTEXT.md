# DATABASE-CONTEXT — Database Layer

> Cập nhật lần cuối: 2026-08-08
> Phạm vi: database/ + prisma/

## Tổng quan

Database layer hiện đang dùng PostgreSQL qua Prisma. Repository pattern được dùng để tách truy vấn database khỏi logic service.

## Cấu trúc hiện tại

- database/prisma-client.js: singleton Prisma client với adapter pg
- database/prisma-report-repository.js: CRUD cho report
- database/prisma-export-run-repository.js: CRUD cho export history
- database/migrate.js: chạy generate + db push
- database/seed.js: tạo users mặc định
- prisma/schema.prisma: schema chính

## Schema hiện tại

### User

- id: Int @id @default(autoincrement())
- name: String @unique
- team: String
- passwordHash: String
- reports: Report[]

### Report

- id: Int @id @default(autoincrement())
- reportDate: String
- stt: String @default("")
- hoTen_ThuocCtyDonVi: String @default("")
- xuongGiao: String @default("")
- xuongNhan: String @default("")
- soThe: String @default("")
- giayTo: String @default("")
- loaiPhuongTien_BSX_BKSRomooc: String @default("")
- soCont_SoSeal: String @default("")
- chiTietHangHoa: String @default("")
- soPhieu: String @default("")
- gioVao: String @default("")
- gioRa: String @default("")
- ghiChu: String @default("")
- rawText: String @default("")
- status: String @default("pending")
- reportType: String?
- userId: Int?

### ExportRun

- id: Int @id @default(autoincrement())
- reportDate: String
- exportType: String @default("manual")
- exportedAt: DateTime
- fileName: String
- filePath: String
- status: String @default("success")
- errorMessage: String?
- createdAt: DateTime @default(now())

## Chức năng hiện có

- Tạo báo cáo và lưu vào reports
- Lấy báo cáo theo ngày
- Cập nhật report và tự tính trạng thái
- Ghi lịch sử xuất Excel vào export_runs
- Chặn duplicate automatic export

## Cài đặt

```bash
npm run migrate
node database/seed.js
```

---

*File này được cập nhật tự động — QuickReportApp Database Context*
      name: "Đội ELA",
      password: elaPassword,
      team: "ELA",
    },
  });

  await prisma.user.upsert({
    where: { name: "Đội DTA" },
    update: {},
    create: {
      name: "Đội DTA",
      password: dtaPassword,
      team: "DTA",
    },
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Chạy seed

```bash
node database/seed.js
```

### Tài khoản mặc định

| Tên đăng nhập | Team | Mật khẩu |
|---------------|------|----------|
| Đội ELA | ELA | ela123456 |
| Đội DTA | DTA | dta123456 |

⚠️ **Lưu ý:** Thay đổi mật khẩu sau khi deploy!

---

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/quickreport?schema=public
```

### Render PostgreSQL

```env
DATABASE_URL=postgresql://user:password@containers-us-west-123.railway.app:5432/database
```

---

## Persistence hiện tại

Hiện tại, hệ thống dùng PostgreSQL qua Prisma như tầng lưu trữ chính cho report, user và export history.

### Những gì đang được dùng

- `User` model cho authentication và team phân biệt
- `Report` model cho dữ liệu báo cáo và trạng thái
- `ExportRun` model cho lịch sử export

### Hướng phát triển tiếp theo

- Hoàn thiện test cho repository và export flow
- Tăng cường logging và error handling
- Chuẩn hóa deployment environment cho môi trường thật

---

*File này được cập nhật tự động — QuickReportApp Database Context*

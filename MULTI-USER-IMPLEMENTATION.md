# Multi-User Implementation Notes

## Mục tiêu

Hệ thống hiện hỗ trợ nhiều người dùng phân biệt theo team, với auto-fill xưởng dựa trên tài khoản đang đăng nhập.

## Luồng hiện tại

1. Người dùng đăng nhập qua /api/auth/login.
2. Backend tạo JWT chứa thông tin user và team.
3. Khi tạo report, service tự phát hiện loại report từ rawText.
4. Nếu là import thì tự fill xuongNhan; nếu là export thì tự fill xuongGiao.
5. Nếu user chưa đăng nhập, hệ thống vẫn lưu report nhưng không auto-fill xưởng.

## Quy tắc auto-fill

- Hàng Nhập / import → xuongNhan = team của user
- Hàng Xuất / export → xuongGiao = team của user
- Nếu trường đã có giá trị thì không ghi đè

## Seed users

Các tài khoản mặc định có thể tạo bằng:

```bash
node database/seed.js
```

## Lưu ý

- Mật khẩu seed chỉ dùng cho môi trường dev/test.
- Trong production nên đổi password và secret sau khi triển khai.

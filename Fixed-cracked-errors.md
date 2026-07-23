# Fixed/Cracked Errors Log

## 1. PowerShell `Set-Location` với đường dẫn chứa khoảng trắng

**Lỗi:**
```
Set-Location: A positional parameter cannot be found that accepts argument 'c:\D drive backup files\projects\QuickReportApp'.
```

**Nguyên nhân:**
PowerShell tự động tách đối số tại khoảng trắng khi dùng `cd /d` (cmd-style). Khi đường dẫn chứa khoảng trắng như `c:\D drive backup files\...`, PowerShell hiểu `c:\D` là đường dẫn và `drive`, `backup`, `files\...` là các đối số phụ — gây lỗi "positional parameter cannot be found".

**Cách fix:**
- Dùng `Set-Location -Path "..."` thay vì `cd /d "..."`.
- Luôn bọc đường dẫn trong dấu ngoặc kép.

**Ví dụ đúng:**
```powershell
Set-Location -Path "c:\D drive backup files\projects\QuickReportApp"
```

**Lưu ý:** Công cụ `execute_command` chạy trên PowerShell nên dùng `Set-Location -Path "..."` thay vì `cd /d "..."`.

## 2. `better-sqlite3` không biên dịch được trên Windows thiếu Windows SDK

**Lỗi:**
```
npm error gyp ERR! find VS could not find a version of Visual Studio 2017 or newer to use
npm error gyp ERR! find VS You need to install the latest version of Visual Studio
npm error gyp ERR! find VS including the "Desktop development with C++" workload.
```

**Nguyên nhân:**
`better-sqlite3` là native module cần biên dịch C++ thông qua `node-gyp`. Môi trường này có Visual Studio 2022 BuildTools nhưng thiếu Windows SDK, nên `node-gyp` không thể tìm thấy toolchain hợp lệ.

**Cách fix:**
- Dùng `sqlite3` (pure JS, có prebuild binary) thay thế cho `better-sqlite3`.
- `sqlite3` cung cấp binary đã biên dịch sẵn qua `prebuild-install`, không cần cài đặt C++ toolchain.

**Lệnh thay thế:**
```bash
npm install sqlite3
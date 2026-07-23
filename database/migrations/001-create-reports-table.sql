-- Migration: 001 — Create reports table
-- Bảng lưu trữ báo cáo nghiệp vụ của QuickReportApp.
-- Mỗi hàng tương ứng với một lần nhập/sửa báo cáo cho một ngày.

CREATE TABLE IF NOT EXISTS reports (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date     TEXT    NOT NULL,                       -- YYYY-MM-DD (do user chọn)
    stt             TEXT    NOT NULL DEFAULT '',            -- Số thứ tự
    hoTen_ThuocCtyDonVi TEXT NOT NULL DEFAULT '',          -- Họ tên - Thuộc Cty/Đơn vị
    xuongGiao       TEXT    NOT NULL DEFAULT '',            -- Xưởng Giao
    xuongNhan       TEXT    NOT NULL DEFAULT '',            -- Xưởng Nhận
    soThe           TEXT    NOT NULL DEFAULT '',            -- Số thẻ
    giay_to         TEXT    NOT NULL DEFAULT '',            -- Loại giấy tờ - Số giấy tờ (đổi tên từ `id` để tránh keyword)
    loaiPhuongTien_BSX_BKSRomooc TEXT NOT NULL DEFAULT '',-- Loại phương tiện - BSX/BKS Rơi-mooc
    soCont_SoSeal   TEXT    NOT NULL DEFAULT '',            -- Số Cont - Số Seal
    chiTietHangHoa  TEXT    NOT NULL DEFAULT '',            -- Số lượng - Đơn vị - Tên hàng hóa
    soPhieu         TEXT    NOT NULL DEFAULT '',            -- Phiếu Giao/Phiếu MHRC
    gioVao          TEXT    NOT NULL DEFAULT '',            -- Giờ vào (HH:MM)
    gioRa           TEXT    NOT NULL DEFAULT '',            -- Giờ ra (HH:MM)
    ghiChu          TEXT    NOT NULL DEFAULT '',            -- Ghi chú
    raw_text        TEXT    NOT NULL DEFAULT '',            -- Báo cáo thô dán từ Zalo
    status          TEXT    NOT NULL DEFAULT 'pending',     -- pending | completed
    created_at      TEXT    NOT NULL,                       -- ISO 8601
    updated_at      TEXT    NOT NULL                        -- ISO 8601
);

-- Index tăng tốc truy vấn theo ngày báo cáo
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);

-- Index tăng tốc truy vấn theo trạng thái
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
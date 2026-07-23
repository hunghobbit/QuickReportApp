-- Migration: 002 — Create export_runs table
-- Bảng lưu lịch sử các lần xuất Excel báo cáo.

CREATE TABLE IF NOT EXISTS export_runs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date     TEXT    NOT NULL,                       -- YYYY-MM-DD (ngày báo cáo được xuất)
    export_type     TEXT    NOT NULL DEFAULT 'manual',      -- manual | automatic
    exported_at     TEXT    NOT NULL,                       -- ISO 8601 - thời điểm xuất
    file_name       TEXT    NOT NULL,                       -- Tên file đã xuất (vd: "Báo cáo 23122024093045.xlsx")
    file_path       TEXT    NOT NULL,                       -- Đường dẫn đầy đủ đến file
    status          TEXT    NOT NULL DEFAULT 'success',     -- success | failed
    error_message   TEXT    DEFAULT '',                     -- Thông báo lỗi nếu status = failed
    created_at      TEXT    NOT NULL                        -- ISO 8601
);

-- Index để tra cứu nhanh theo ngày báo cáo
CREATE INDEX IF NOT EXISTS idx_export_runs_report_date ON export_runs(report_date);

-- Index để tra cứu nhanh theo loại xuất
CREATE INDEX IF NOT EXISTS idx_export_runs_export_type ON export_runs(export_type);

-- Index để tra cứu nhanh theo trạng thái
CREATE INDEX IF NOT EXISTS idx_export_runs_status ON export_runs(status);

-- Index để tìm lượt xuất gần nhất theo ngày và loại
CREATE INDEX IF NOT EXISTS idx_export_runs_date_type ON export_runs(report_date, export_type, exported_at DESC);
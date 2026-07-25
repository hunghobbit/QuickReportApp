"use client";

import { useEffect } from "react";
import Button from "@/components/ui/button";

/**
 * ReportViewModal — Modal xem chi tiết (chỉ đọc) cho báo cáo đã ra xưởng.
 * Không có form chỉnh sửa, chỉ hiển thị thông tin.
 *
 * @param {object}       props
 * @param {object|null}  props.viewRecord - Bản ghi đang xem (null = đóng)
 * @param {() => void}   props.onClose    - Callback khi đóng modal
 */
export default function ReportViewModal({ viewRecord, onClose }) {
  // Đóng modal bằng Escape
  useEffect(() => {
    if (!viewRecord) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [viewRecord, onClose]);

  if (!viewRecord) return null;

  const {
    stt,
    hoTen_ThuocCtyDonVi,
    xuongGiao,
    xuongNhan,
    soThe,
    loaiPhuongTien_BSX_BKSRomooc,
    soCont_SoSeal,
    chiTietHangHoa,
    soPhieu,
    gioVao,
    gioRa,
    ghiChu,
  } = viewRecord;

  const fields = [
    { label: "Số thứ tự", value: stt || "—" },
    { label: "Họ tên / Công ty", value: hoTen_ThuocCtyDonVi || "—" },
    { label: "Số thẻ", value: soThe || "—" },
    { label: "Số phiếu", value: soPhieu || "—" },
    { label: "Phương tiện", value: loaiPhuongTien_BSX_BKSRomooc || "—" },
    { label: "Cont/Seal", value: soCont_SoSeal || "—" },
    { label: "Xưởng giao", value: xuongGiao || "—" },
    { label: "Xưởng nhận", value: xuongNhan || "—" },
    { label: "Giờ vào", value: gioVao || "—" },
    { label: "Giờ ra", value: gioRa || "—" },
    { label: "Chi tiết hàng hóa", value: chiTietHangHoa || "—" },
    { label: "Ghi chú", value: ghiChu || "—" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold">Chi tiết báo cáo</h2>
            <p className="text-sm text-muted-foreground">
              Thông tin báo cáo đã ra xưởng (chỉ xem).
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5">
          <div className="grid gap-3">
            {fields.map((field) => (
              <div
                key={field.label}
                className="grid grid-cols-2 gap-2 text-sm"
              >
                <span className="font-medium text-muted-foreground">
                  {field.label}
                </span>
                <span className="text-foreground">{field.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t p-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

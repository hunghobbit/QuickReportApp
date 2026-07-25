"use client";

/**
 * ReportCard — Hiển thị thông tin một báo cáo dạng card.
 * Không dùng ảnh, hiển thị thông tin nhận diện, giờ vào/ra và cảnh báo thiếu dữ liệu.
 *
 * Trên desktop: nút "Chỉnh sửa" chỉ hiện khi hover/focus (chỉ áp dụng cho card pending).
 * Trên mobile: toàn bộ card có thể chạm để mở form chỉnh sửa (pending) hoặc xem chi tiết (completed).
 *
 * @param {object}   props
 * @param {object}   props.record      - Dữ liệu báo cáo từ API
 * @param {boolean}  props.isPending   - Card thuộc tab "Chưa ra xưởng"
 * @param {(record: object) => void} [props.onEdit] - Callback khi bấm nút Chỉnh sửa / chạm card pending
 * @param {(record: object) => void} [props.onView] - Callback khi chạm card completed (xem chi tiết)
 */
export default function ReportCard({ record, isPending, onEdit, onView }) {
  const {
    id,
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
  } = record;

  // Cảnh báo thiếu dữ liệu — highlight các trường trống
  const missing = [];
  if (!soThe) missing.push("Số thẻ");
  if (!soPhieu) missing.push("Số phiếu");
  if (!xuongGiao) missing.push("Xưởng giao");
  if (!xuongNhan) missing.push("Xưởng nhận");

  // Xác định hành vi chạm: pending -> edit, completed -> view
  const handleCardClick = () => {
    if (isPending && onEdit) {
      onEdit(record);
    } else if (!isPending && onView) {
      onView(record);
    }
  };

  // Chỉ bật click trên mobile (chạm) — trên desktop dùng nút hover riêng
  const isClickable = isPending ? !!onEdit : !!onView;

  return (
    <div
      className={`group relative rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md
        ${isClickable ? "cursor-pointer sm:cursor-default" : "cursor-default"}`}
      onClick={isClickable ? handleCardClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick();
              }
            }
          : undefined
      }
    >
      {/* Nút Chỉnh sửa — chỉ hiện trên card pending khi hover/focus (desktop) */}
      {isPending && onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(record);
          }}
          className="absolute right-2 top-2 z-10 hidden rounded-md border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground group-hover:block focus:block focus:outline-none focus:ring-2 focus:ring-ring"
        >
          Chỉnh sửa
        </button>
      )}

      {/* Header: Số thứ tự + thông tin nhận diện */}
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-foreground">
            {stt ? (
              <span className="mr-1.5 inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                #{stt}
              </span>
            ) : null}
            {hoTen_ThuocCtyDonVi || <span className="italic text-muted-foreground">(chưa có tên)</span>}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {soThe ? `Thẻ: ${soThe}` : ""}
            {soThe && soPhieu ? " · " : ""}
            {soPhieu ? `Phiếu: ${soPhieu}` : ""}
          </p>
        </div>
      </div>

      {/* Thông tin phương tiện / cont / seal */}
      {loaiPhuongTien_BSX_BKSRomooc && (
        <p className="mb-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Phương tiện:</span>{" "}
          {loaiPhuongTien_BSX_BKSRomooc}
        </p>
      )}
      {soCont_SoSeal && (
        <p className="mb-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Cont/Seal:</span>{" "}
          {soCont_SoSeal}
        </p>
      )}

      {/* Xưởng giao → xưởng nhận */}
      <p className="mb-1 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Xưởng:</span>{" "}
        {xuongGiao || <span className="italic">(?)</span>}
        {" → "}
        {xuongNhan || <span className="italic">(?)</span>}
      </p>

      {/* Chi tiết hàng hóa */}
      {chiTietHangHoa && (
        <p className="mb-1 line-clamp-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Hàng hóa:</span>{" "}
          {chiTietHangHoa}
        </p>
      )}

      {/* Giờ vào / ra */}
      <div className="mt-2 flex items-center gap-3 border-t border-border pt-2 text-xs">
        <span>
          <span className="font-medium text-foreground">Vào:</span>{" "}
          {gioVao || <span className="italic text-destructive">(?)</span>}
        </span>
        <span>
          <span className="font-medium text-foreground">Ra:</span>{" "}
          {gioRa || <span className="italic text-muted-foreground">(chưa có)</span>}
        </span>
        {ghiChu && (
          <span className="ml-auto max-w-[120px] truncate text-muted-foreground">
            📝 {ghiChu}
          </span>
        )}
      </div>

      {/* Cảnh báo thiếu dữ liệu */}
      {missing.length > 0 && (
        <div className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
          ⚠ Thiếu: {missing.join(", ")}
        </div>
      )}
    </div>
  );
}

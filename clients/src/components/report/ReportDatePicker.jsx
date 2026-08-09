"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, displayDate } from "@/utils/date";

/**
 * ReportDatePicker — Chọn ngày báo cáo hiện hành.
 *
 * @param {object} props
 * @param {string} props.date - Ngày hiện tại (YYYY-MM-DD)
 * @param {(date: string) => void} props.onChange - Callback khi đổi ngày
 */
export default function ReportDatePicker({ date, onChange }) {
  function goTo(delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    onChange(formatDate(d));
  }

  function handleChange(e) {
    onChange(e.target.value);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => goTo(-1)}
        className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Ngày trước"
      >
        <ChevronLeft className="size-5" />
      </button>

      <input
        type="date"
        value={date}
        onChange={handleChange}
        className="report-date-input rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <button
        type="button"
        onClick={() => goTo(1)}
        className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Ngày sau"
      >
        <ChevronRight className="size-5" />
      </button>

      <span className="hidden text-sm text-muted-foreground sm:inline">
        {displayDate(date)}
      </span>
    </div>
  );
}
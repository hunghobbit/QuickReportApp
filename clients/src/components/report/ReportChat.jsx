"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";
import { parseReportText } from "_#/modules/parser";
import { normalizeRecordInput, RECORD_SCHEMA } from "_#/configs/record-schema";
import { useModalFormInitValues } from "@/contexts/ExportContext";
import { openReportForm } from "./ReportFormModal";

export const OPEN_REPORT_CHAT_EVENT = "open-report-chat";

export function openReportChat() {
  window.dispatchEvent(new Event(OPEN_REPORT_CHAT_EVENT));
}

export default function ReportChat() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const textareaRef = useRef(null);
  const { setInitForm } = useModalFormInitValues();

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(OPEN_REPORT_CHAT_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_REPORT_CHAT_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => textareaRef.current.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleSave(e) {
    if (!content) {
      alert("Vui lòng nhập nội dung báo cáo");
    } else {
      const rawFields = parseReportText(content);
      const normalizes = normalizeRecordInput(rawFields);
      setInitForm(normalizes);
      openReportForm();
      // ["Số thẻ", "Giờ ra"]
      e.preventDefault();
      setOpen(false);
      setContent("");
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tạo báo cáo mới"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-foreground/40"
        onClick={() => setOpen(false)}
      />

      {/* Dialog panel */}
      <form
        onSubmit={handleSave}
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-2xl"
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung báo cáo của bạn ở đây..."
          aria-label="Nội dung báo cáo"
          className="min-h-[300px] w-full flex-1 resize-none rounded-lg border border-input bg-background p-4 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" className="h-10 px-5">
            Quét Văn Bản
          </Button>
        </div>
      </form>
    </div>
  );
}

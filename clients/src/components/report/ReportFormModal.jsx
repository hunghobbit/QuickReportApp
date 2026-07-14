// report-form-modal.jsx

"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import {
  buildRecordPayload,
  createInitialRecordForm,
} from "@/config/record-schema";
import ReportForm from "./ReportForm";

export const OPEN_REPORT_FORM_EVENT = "open-report-form";

export function openReportForm() {
  window.dispatchEvent(new Event(OPEN_REPORT_FORM_EVENT));
}

const initialForm = createInitialRecordForm();

export default function ReportFormModal() {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleOpen = () => setOpen(true);

    window.addEventListener(OPEN_REPORT_FORM_EVENT, handleOpen);

    return () => window.removeEventListener(OPEN_REPORT_FORM_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEsc);

    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:3000/api/write-record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildRecordPayload(form)),
      });

      if (!response.ok) {
        throw new Error("Không thể tạo file Excel");
      }

      const blob = await response.blob();

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = `report_${Date.now()}.xlsx`;

      a.click();

      URL.revokeObjectURL(url);

      setMessage("Xuất Excel thành công.");

      setForm(initialForm);

      setOpen(false);
    } catch (err) {
      setMessage(err.message ?? "Có lỗi xảy ra.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold">Thông tin báo cáo</h2>

            <p className="text-sm text-muted-foreground">
              Điền đầy đủ thông tin trước khi xuất Excel.
            </p>
          </div>

          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5">
          <ReportForm form={form} setForm={setForm} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t p-5">
          <span className="text-sm text-muted-foreground">{message}</span>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xuất..." : "Xuất Excel"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

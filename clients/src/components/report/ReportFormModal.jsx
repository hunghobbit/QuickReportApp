// report-form-modal.jsx

"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/button";
import {
  buildRecordPayload,
  createInitialRecordForm,
} from "@/config/record-schema";
import ReportForm from "./ReportForm";
import { getReportFormErrors, validateReportForm } from "@/features/report/validator";
import { useModalFormInitValues } from "@/contexts/ExportContext";

let initValues = null;
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

  const [errors, setErrors] = useState({});

  const { initForm } = useModalFormInitValues();

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

  useEffect(() => {
    if(open){{
      setForm(createInitialRecordForm(initForm));
      setErrors({})
      setMessage("")
    }}
  },[open, initForm])
  async function handleSubmit(e) {
    e.preventDefault();

    const validation = validateReportForm(form);
    if (validation.error) {
      setErrors(getReportFormErrors(form));
      setMessage("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setErrors({});

    try {
      
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
          <ReportForm
            form={form}
            setForm={setForm}
            errors={errors}
            onFieldChange={(name) =>
              setErrors((current) => {
                if (!current[name]) return current;
                const next = { ...current };
                delete next[name];
                return next;
              })
            }
          />
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
              {isSubmitting ? "Đang thêm..." : "Thêm báo cáo"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

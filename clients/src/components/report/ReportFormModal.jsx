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
import { createReport, updateReport } from "@/utils/api";

export const OPEN_REPORT_FORM_EVENT = "open-report-form";

export function openReportForm() {
  window.dispatchEvent(new Event(OPEN_REPORT_FORM_EVENT));
}

/**
 * ReportFormModal — Modal tạo hoặc chỉnh sửa báo cáo.
 *
 * @param {object}       props
 * @param {object|null}  props.editRecord - Bản ghi đang chỉnh sửa (null = tạo mới)
 * @param {() => void}   props.onSaved    - Callback sau khi lưu thành công
 * @param {() => void}   props.onClose    - Callback khi modal đóng
 */
export default function ReportFormModal({ editRecord, onSaved, onClose }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => createInitialRecordForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "error" | "success"
  const [errors, setErrors] = useState({});

  const { initForm, reportDate } = useModalFormInitValues();

  // Mở modal khi nhận event (dùng cho nút "Thêm báo cáo")
  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener(OPEN_REPORT_FORM_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_REPORT_FORM_EVENT, handleOpen);
  }, []);

  // Khi có editRecord (khác null) và modal chưa mở -> mở modal
  useEffect(() => {
    if (editRecord) {
      setOpen(true);
    }
  }, [editRecord]);

  // Đóng modal bằng Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  // Reset form mỗi khi modal mở
  useEffect(() => {
    if (!open) return;

    // Ưu tiên editRecord, sau đó initForm (từ scanner), cuối cùng là form rỗng
    let initialValues;
    if (editRecord && editRecord.stt !== undefined) {
      // Chuyển đổi từ record API (dạng ghép) sang form fields (dạng tách)
      initialValues = {
        stt: editRecord.stt || "",
        hoTen: "",
        thuocCtyDonVi: "",
        xuongGiao: editRecord.xuongGiao || "",
        xuongNhan: editRecord.xuongNhan || "",
        soThe: editRecord.soThe || "",
        id: editRecord.businessId || "",
        loaiPhuongTien: "",
        bks: "",
        bksRomooc: "",
        soCont: "",
        soSeal: "",
        chiTietHangHoa: editRecord.chiTietHangHoa || "",
        soPhieu: editRecord.soPhieu || "",
        gioVao: editRecord.gioVao || "",
        gioRa: editRecord.gioRa || "",
        ghiChu: editRecord.ghiChu || "",
      };
      // Giải ghép hoTen_ThuocCtyDonVi
      if (editRecord.hoTen_ThuocCtyDonVi) {
        const parts = editRecord.hoTen_ThuocCtyDonVi.split(" - ");
        initialValues.hoTen = parts[0] || "";
        initialValues.thuocCtyDonVi = parts[1] || "";
      }
      // Giải ghép loaiPhuongTien_BSX_BKSRomooc
      if (editRecord.loaiPhuongTien_BSX_BKSRomooc) {
        const parts = editRecord.loaiPhuongTien_BSX_BKSRomooc.split(" - ");
        initialValues.loaiPhuongTien = parts[0] || "";
        initialValues.bks = parts[1] || "";
        initialValues.bksRomooc = parts[2] || "";
      }
      // Giải ghép soCont_SoSeal
      if (editRecord.soCont_SoSeal) {
        const parts = editRecord.soCont_SoSeal.split(" - ");
        initialValues.soCont = parts[0] || "";
        initialValues.soSeal = parts[1] || "";
      }
    } else {
      initialValues = initForm;
    }
    setForm(createInitialRecordForm(initialValues));
    setErrors({});
    setMessage("");
    setMessageType("info");
  }, [open, initForm, editRecord]);

  function closeModal() {
    setOpen(false);
    if (onClose) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate với mode draft trước (cho phép gioRa trống)
    const validation = validateReportForm(form, "draft");
    if (validation.error) {
      setErrors(getReportFormErrors(form, "draft"));
      setMessage("Vui lòng kiểm tra các trường được đánh dấu.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");
    setMessageType("info");
    setErrors({});

    try {
      // Xây dựng payload để gửi lên API
      const payload = buildRecordPayload(form);

      // Gắn reportDate và mode (draft nếu chưa có gioRa)
      const mode = form.gioRa ? "complete" : "draft";
      const body = {
        reportDate,
        ...payload,
        mode,
      };

      let result;
      if (editRecord && editRecord.id) {
        // Chế độ chỉnh sửa
        result = await updateReport(editRecord.id, body);
      } else {
        // Chế độ tạo mới
        result = await createReport(body);
      }

      if (result.success) {
        setMessage(editRecord ? "Cập nhật báo cáo thành công!" : "Thêm báo cáo thành công!");
        setMessageType("success");
        // Gọi onSaved để reload danh sách
        // setTimeout đảm bảo modal đóng sau khi reload
        setTimeout(() => {
          if (onSaved) onSaved();
          closeModal();
        }, 1500);
      } else {
        setMessage(result.message || "Không thể lưu báo cáo.");
        setMessageType("error");
      }
    } catch (err) {
      setMessage(err.message ?? "Có lỗi xảy ra khi kết nối đến server.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  const messageColor =
    messageType === "success"
      ? "text-green-600"
      : messageType === "error"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => closeModal()}
      />

      {/* Modal */}
      <form
        onSubmit={handleSubmit}
        className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-background shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="text-xl font-semibold">
              {editRecord ? "Chỉnh sửa báo cáo" : "Thông tin báo cáo"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {editRecord
                ? "Điều chỉnh thông tin báo cáo."
                : "Kiểm tra và điều chỉnh thông tin trước khi lưu báo cáo."}
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={() => closeModal()}>
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
          <span className={`text-sm ${messageColor}`}>{message}</span>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => closeModal()}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Đang lưu..."
                : editRecord
                  ? "Cập nhật báo cáo"
                  : "Lưu báo cáo"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
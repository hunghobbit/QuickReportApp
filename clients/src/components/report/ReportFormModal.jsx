"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/ui/button";
import {
  buildRecordPayload,
  createInitialRecordForm,
} from "@/config/record-schema";
import ReportForm from "./ReportForm";
import { getReportFormErrors, validateReportForm } from "@/features/report/validator";
import { generateReportFromImages } from "@/features/ai/ai-api";
import { useModalFormInitValues } from "@/contexts/ExportContext";
import { createReport, updateReport } from "@/utils/api";

const MAX_GATE_IMAGES = 8;

function normalizeReportType(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  if (text === "import" || text.includes("nhập")) return "import";
  if (text === "export" || text.includes("xuất")) return "export";
  return "";
}

function normalizeOCRTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const match = text.match(/(\d{1,2})\D{0,2}(\d{1,2})/);
  if (!match) return "";

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return "";

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getCurrentTimeHHmm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function extractValueFromReportText(reportText, labelPattern) {
  const text = String(reportText || "");
  if (!text) return "";

  const regex = new RegExp(`${labelPattern}\\s*:\\s*(.+)`, "i");
  const match = text.match(regex);
  return match?.[1]?.trim() || "";
}

function splitSoPhieuHangHoa(value) {
  const text = String(value || "").trim();
  if (!text) {
    return { soPhieu: "", chiTietHangHoa: "" };
  }

  const parts = text
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      soPhieu: parts[0],
      chiTietHangHoa: parts.slice(1).join(" / "),
    };
  }

  return { soPhieu: "", chiTietHangHoa: text };
}

function getGateUpdatesFromAIResult(result) {
  const source = [
    result?.record,
    result?.reportData,
    result?.parsedData,
    result?.parsedReport,
    result?.formData,
    result?.fields,
    result,
  ].find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};

  const reportText = typeof result?.report === "string" ? result.report : "";

  let soPhieu = String(source.soPhieu || "").trim();
  let chiTietHangHoa = String(source.chiTietHangHoa || "").trim();

  const soPhieuHangHoa = String(source.soPhieuHangHoa || "").trim();
  if ((!soPhieu || !chiTietHangHoa) && soPhieuHangHoa) {
    const split = splitSoPhieuHangHoa(soPhieuHangHoa);
    soPhieu = soPhieu || split.soPhieu;
    chiTietHangHoa = chiTietHangHoa || split.chiTietHangHoa;
  }

  if (!soPhieu || !chiTietHangHoa) {
    const combined = extractValueFromReportText(
      reportText,
      "Phiếu\\s*MHRC\\/\\s*Chủng\\s*loại\\s*\\/\\s*Số\\s*lượng",
    );
    const split = splitSoPhieuHangHoa(combined);
    soPhieu = soPhieu || split.soPhieu;
    chiTietHangHoa = chiTietHangHoa || split.chiTietHangHoa;
  }

  const gioRaRaw = String(source.gioRa || "").trim() || extractValueFromReportText(reportText, "Giờ\\s*ra");
  const soCont = String(source.soCont || "").trim() || extractValueFromReportText(reportText, "Cont");
  const soSeal = String(source.soSeal || source.seal || "").trim() || extractValueFromReportText(reportText, "Seal");

  return {
    soPhieu,
    chiTietHangHoa,
    gioRa: normalizeOCRTime(gioRaRaw),
    soCont,
    soSeal,
    reportText,
  };
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
  const [form, setForm] = useState(() => ({
    ...createInitialRecordForm(),
    reportType: "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // "info" | "error" | "success"
  const [errors, setErrors] = useState({});
  const [gateImages, setGateImages] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isProcessingGateOCR, setIsProcessingGateOCR] = useState(false);
  const [gateStatus, setGateStatus] = useState("");
  const [gateStatusType, setGateStatusType] = useState("info");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    initForm,
    reportDate,
    isReportFormModalOpen,
    openReportFormModal,
    closeReportFormModal,
  } = useModalFormInitValues();

  // Khi có editRecord (khác null) và modal chưa mở -> mở modal
  useEffect(() => {
    if (editRecord && !isReportFormModalOpen) {
      openReportFormModal();
    }
  }, [editRecord, isReportFormModalOpen, openReportFormModal]);

  // Đóng modal bằng Escape
  useEffect(() => {
    if (!isReportFormModalOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isReportFormModalOpen]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const bindStreamToVideo = useCallback(async () => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    try {
      await video.play();
    } catch {
      // Mobile browser có thể từ chối play tạm thời ngay sau khi mount.
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!editRecord) return;

    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraActive(true);
    } catch {
      setCameraError("Không thể truy cập camera. Bạn vẫn có thể thêm ảnh từ thư viện.");
      setIsCameraActive(false);
    }
  }, [editRecord]);

  useEffect(() => {
    if (!isCameraActive) return;
    void bindStreamToVideo();
  }, [isCameraActive, bindStreamToVideo]);

  // Reset form mỗi khi modal mở
  useEffect(() => {
    if (!isReportFormModalOpen) return;

    // Ưu tiên editRecord, sau đó initForm (từ scanner), cuối cùng là form rỗng
    let initialValues;
    if (editRecord && editRecord.stt !== undefined) {
      // Chuyển đổi từ record API (dạng ghép) sang form fields (dạng tách)
      initialValues = {
        stt: editRecord.stt || "",
        hoTen: "",
        thuocCtyDonVi: "",
        reportType: normalizeReportType(editRecord.reportType),
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
    setForm({
      ...createInitialRecordForm(initialValues),
      reportType: normalizeReportType(initialValues.reportType),
    });
    setErrors({});
    setMessage("");
    setMessageType("info");
    setGateImages([]);
    setGateStatus("");
    setGateStatusType("info");

    if (editRecord) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isReportFormModalOpen, initForm, editRecord, startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  function closeModal() {
    stopCamera();
    closeReportFormModal();
    if (onClose) onClose();
  }

  function clearGateErrors(changedFields = []) {
    if (!changedFields.length) return;

    setErrors((current) => {
      let hasChanges = false;
      const next = { ...current };

      changedFields.forEach((name) => {
        if (next[name]) {
          delete next[name];
          hasChanges = true;
        }
      });

      return hasChanges ? next : current;
    });
  }

  function captureGateImage() {
    if (!videoRef.current) return;
    if (gateImages.length >= MAX_GATE_IMAGES) {
      setGateStatus(`Đã đạt tối đa ${MAX_GATE_IMAGES} ảnh.`);
      setGateStatusType("error");
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

    const nextImages = [...gateImages, { data: dataUrl, dataUrl, mimeType: "image/jpeg" }];
    setGateImages(nextImages);
    setGateStatus(`Đã thêm ảnh (${Math.min(gateImages.length + 1, MAX_GATE_IMAGES)}/${MAX_GATE_IMAGES}).`);
    setGateStatusType("info");
    void runGateOCR(nextImages);
  }

  async function handleLibraryUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_GATE_IMAGES - gateImages.length;
    const selected = files.slice(0, remaining);

    const converted = await Promise.all(
      selected.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                data: reader.result,
                dataUrl: reader.result,
                mimeType: file.type || "image/jpeg",
              });
            };
            reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
            reader.readAsDataURL(file);
          }),
      ),
    );

    const nextImages = [...gateImages, ...converted];
    setGateImages(nextImages);
    setGateStatus(`Đã thêm ${converted.length} ảnh từ thư viện.`);
    setGateStatusType("info");
    void runGateOCR(nextImages);
    if (e.target) e.target.value = "";
  }

  async function runGateOCR(imagesToProcess = gateImages) {
    if (!editRecord) return;
    if (imagesToProcess.length === 0) {
      setGateStatus("Vui lòng chụp hoặc chọn ít nhất 1 ảnh để OCR.");
      setGateStatusType("error");
      return;
    }

    setIsProcessingGateOCR(true);
    setGateStatus("AI đang phân tích ảnh xe/hàng ra cổng...");
    setGateStatusType("info");

    try {
      const receivingCompany = String(form.thuocCtyDonVi || "").trim();
      const reason = `Xuất hàng về ${receivingCompany || "đơn vị nhận"}`;

      const res = await generateReportFromImages({
        reportType: "Xuất",
        images: imagesToProcess,
        companyName: receivingCompany,
        goodsDetails: form.chiTietHangHoa || "",
        xuongGiao: form.xuongGiao || "",
        xuongNhan: form.xuongNhan || receivingCompany,
        reason,
      });

      if (!res.success) {
        setGateStatus(res.message || "Không thể OCR ảnh ra cổng.");
        setGateStatusType("error");
        return;
      }

      const updates = getGateUpdatesFromAIResult(res.data || {});
      const nextGioRa = updates.gioRa || form.gioRa || getCurrentTimeHHmm();

      setForm((prev) => ({
        ...prev,
        reportType: "export",
        gioRa: nextGioRa,
        ...(updates.soPhieu ? { soPhieu: updates.soPhieu } : {}),
        ...(updates.chiTietHangHoa ? { chiTietHangHoa: updates.chiTietHangHoa } : {}),
        ...(updates.soCont ? { soCont: updates.soCont } : {}),
        ...(updates.soSeal ? { soSeal: updates.soSeal } : {}),
      }));

      clearGateErrors(["reportType", "gioRa", "soPhieu", "chiTietHangHoa", "soCont", "soSeal"]);

      setGateStatus("Đã cập nhật dữ liệu ra cổng từ OCR. Bạn có thể bấm Cập nhật báo cáo để hoàn tất đơn.");
      setGateStatusType("success");
    } catch (err) {
      setGateStatus(err.message || "Có lỗi khi OCR ảnh ra cổng.");
      setGateStatusType("error");
    } finally {
      setIsProcessingGateOCR(false);
    }
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
        ...(form.reportType ? { reportType: form.reportType } : {}),
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

  if (!isReportFormModalOpen) return null;

  const messageColor =
    messageType === "success"
      ? "text-green-600"
      : messageType === "error"
        ? "text-red-600"
        : "text-muted-foreground";

  const gateStatusColor =
    gateStatusType === "success"
      ? "text-green-600"
      : gateStatusType === "error"
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
          {editRecord ? (
            <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <div className="grid gap-1 md:max-w-sm">
                <label className="text-sm font-medium text-foreground" htmlFor="reportType">
                  Loại báo cáo
                </label>
                <select
                  id="reportType"
                  name="reportType"
                  value={form.reportType || ""}
                  onChange={(e) => {
                    setForm((prev) => ({
                      ...prev,
                      reportType: e.target.value,
                    }));
                  }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="">Chọn loại báo cáo</option>
                  <option value="import">Hàng nhập</option>
                  <option value="export">Hàng xuất</option>
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Cập nhật ảnh xe ra và hàng ra cổng</h3>
                  <p className="text-xs text-muted-foreground">
                    Chụp ảnh hoặc chọn từ thư viện để OCR tự điền Phiếu MHRC/Chủng loại/Số lượng, Giờ ra, Cont, Seal.
                  </p>
                </div>

                {isCameraActive ? (
                  <div className="relative overflow-hidden rounded-xl border border-border bg-black">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      webkit-playsinline="true"
                      muted
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-black/40 p-3">
                      <Button
                        type="button"
                        onClick={captureGateImage}
                        disabled={isProcessingGateOCR}
                        className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-white/20 text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
                        aria-label="Chụp ảnh ra cổng"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background p-5 text-center">
                    <p className="text-sm text-muted-foreground">
                      {cameraError || "Camera chưa sẵn sàng."}
                    </p>
                    <Button type="button" variant="outline" onClick={startCamera}>
                      Bật lại camera
                    </Button>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessingGateOCR}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Thêm ảnh từ thư viện
                  </Button>
                  {gateImages.length > 0 ? (
                    <span className="text-xs text-muted-foreground">Đã chọn {gateImages.length} ảnh</span>
                  ) : null}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleLibraryUpload}
                />

                {gateStatus ? (
                  <p className={`text-sm ${gateStatusColor}`}>{gateStatus}</p>
                ) : null}
              </div>
            </div>
          ) : null}

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
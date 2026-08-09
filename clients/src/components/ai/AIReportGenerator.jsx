// clients/src/components/ai/AIReportGenerator.jsx
// Modal chính cho luồng AI Report Generator.
// Bước 1: CameraCapture (chụp ảnh + watermark)
// Bước 2: Loading (gọi API generateReportFromImages)
// Bước 3: ReportResultBox (hiển thị kết quả)
// Bước 4: "Điền vào form" → setInitForm + openReportForm

import { useEffect, useState, useCallback } from "react";
import Button from "@/components/ui/button";
import CameraCapture from "./CameraCapture";
import ReportResultBox from "./ReportResultBox";
import { generateReportFromImages } from "@/features/ai/ai-api";

export const OPEN_AI_REPORT_GENERATOR_EVENT = "open-ai-report-generator";

export function openAIReportGenerator() {
  window.dispatchEvent(new Event(OPEN_AI_REPORT_GENERATOR_EVENT));
}

// Các bước trong luồng
const STEP = {
  CAPTURE: "capture",
  LOADING: "loading",
  RESULT: "result",
};

export default function AIReportGenerator() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(STEP.CAPTURE);
  const [reportType, setReportType] = useState("Nhập");
  const [companyName, setCompanyName] = useState("");
  const [goodsSummary, setGoodsSummary] = useState("");
  const [images, setImages] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Mở modal khi nhận event
  useEffect(() => {
    const handleOpen = () => {
      setOpen(true);
      setStep(STEP.CAPTURE);
      setReportType("Nhập");
      setCompanyName("");
      setGoodsSummary("");
      setImages([]);
      setResult(null);
      setError("");
    };
    window.addEventListener(OPEN_AI_REPORT_GENERATOR_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_AI_REPORT_GENERATOR_EVENT, handleOpen);
  }, []);

  // Đóng bằng Escape
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open]);

  // Nhận ảnh từ CameraCapture → gọi AI
  const handleCapture = useCallback(
    async (capturedImages) => {
      setImages(capturedImages);
      setStep(STEP.LOADING);
      setError("");

      try {
        const normalizedCompanyName = (companyName || "").trim();
        const goodsDetails = goodsSummary.trim();
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const userTeam = (currentUser.team || "").trim();

        const isExport = reportType === "Xuất";
        const xuongGiao = isExport
          ? (userTeam || normalizedCompanyName)
          : normalizedCompanyName;
        const xuongNhan = isExport
          ? normalizedCompanyName
          : (userTeam || normalizedCompanyName);

        const fallbackReason = isExport
          ? `Xuất hàng từ ${xuongGiao || "xưởng hiện tại"} sang ${xuongNhan || "xưởng nhận"}`
          : `Nhập hàng từ ${xuongGiao || "xưởng giao"} vào ${xuongNhan || "xưởng hiện tại"}`;

        const res = await generateReportFromImages({
          reportType,
          goodsDetails,
          images: capturedImages,
          companyName: normalizedCompanyName,
          transportCompany: userTeam,
          team: userTeam,
          xuongGiao,
          xuongNhan,
          reason: fallbackReason,
        });

        if (res.success) {
          setResult(res.data);
          setStep(STEP.RESULT);
        } else {
          setError(res.message || "Không thể tạo báo cáo AI.");
          setStep(STEP.CAPTURE);
        }
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi gọi AI.");
        setStep(STEP.CAPTURE);
      }
    },
    [companyName, goodsSummary, reportType],
  );

  // Chụp lại → quay lại bước chụp
  const handleRetake = useCallback(() => {
    setStep(STEP.CAPTURE);
    setResult(null);
    setImages([]);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tạo báo cáo bằng AI"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Đóng"
        className="absolute inset-0 bg-foreground/40"
        onClick={() => setOpen(false)}
      />

      {/* Dialog panel */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-xl font-semibold">Tạo báo cáo bằng AI</h2>
            <p className="text-sm text-muted-foreground">
              Chụp ảnh giấy tờ, biển số, container... AI sẽ tự tạo báo cáo.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </div>

        {/* Body */}
        {step === STEP.CAPTURE && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm font-medium">
                Loại báo cáo
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="Nhập">Nhập</option>
                  <option value="Xuất">Xuất</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium">
                {reportType === "Xuất" ? "Xưởng Nhận" : "Xưởng Giao"}
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={reportType === "Xuất" ? "Tên xưởng nhận" : "Tên xưởng giao"}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            </div>

            {reportType === "Nhập" && (
              <label className="flex flex-col gap-1 text-sm font-medium">
                Chủng loại số lượng
                <textarea
                  value={goodsSummary}
                  onChange={(e) => setGoodsSummary(e.target.value)}
                  placeholder="VD: 100 thùng hàng hóa, 3 loại sản phẩm..."
                  rows={3}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </label>
            )}
            <CameraCapture onCapture={handleCapture} onClose={() => setOpen(false)} />
          </div>
        )}

        {step === STEP.LOADING && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <span className="inline-block size-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              AI đang phân tích {images.length} ảnh và tạo báo cáo...
            </p>
          </div>
        )}

        {step === STEP.RESULT && result && (
          <ReportResultBox
            result={result}
            onRetake={handleRetake}
            onClose={() => setOpen(false)}
          />
        )}

        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}
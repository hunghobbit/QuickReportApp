// clients/src/components/ai/ReportResultBox.jsx
// Hiển thị kết quả AI Report Generator: report text, found/missing fields, warnings.
// Tạm thời chỉ hiển thị payload đã merge để kiểm tra trước khi điền Excel.

import { useState } from "react";
import Button from "@/components/ui/button";
import { buildRecordPayload, RECORD_SCHEMA } from "@/config/record-schema";
import { useModalFormInitValues } from "@/contexts/ExportContext";

const REPORT_FORM_FIELDS = [
    "hoTen",
    "thuocCtyDonVi",
    "xuongGiao",
    "xuongNhan",
    "soThe",
    "id",
    "loaiPhuongTien",
    "bks",
    "bksRomooc",
    "soCont",
    "soSeal",
    "chiTietHangHoa",
    "soPhieu",
    "gioVao",
    "gioRa",
    "ghiChu",
];

function mapAIFieldsToFormFields(source = {}) {
    const soPhieuHangHoa = typeof source.soPhieuHangHoa === "string"
        ? source.soPhieuHangHoa
        : "";

    let soPhieu = typeof source.soPhieu === "string" ? source.soPhieu : "";
    let chiTietHangHoa = typeof source.chiTietHangHoa === "string"
        ? source.chiTietHangHoa
        : "";

    if (soPhieuHangHoa && !soPhieu && !chiTietHangHoa) {
        const slashIndex = soPhieuHangHoa.indexOf("/");
        if (slashIndex > 0) {
            soPhieu = soPhieuHangHoa.slice(0, slashIndex).trim();
            chiTietHangHoa = soPhieuHangHoa.slice(slashIndex + 1).trim();
        } else {
            chiTietHangHoa = soPhieuHangHoa;
        }
    }

    return {
        hoTen: source.hoTen,
        thuocCtyDonVi: source.thuocCtyDonVi || source.congTy,
        xuongGiao: source.xuongGiao,
        xuongNhan: source.xuongNhan,
        soThe: source.soThe,
        id: source.id,
        loaiPhuongTien: source.loaiPhuongTien || source.phuongTien,
        bks: source.bks || source.bienSo,
        bksRomooc: source.bksRomooc,
        soCont: source.soCont,
        soSeal: source.soSeal || source.seal,
        chiTietHangHoa,
        soPhieu,
        gioVao: source.gioVao,
        gioRa: source.gioRa,
        ghiChu: source.ghiChu,
    };
}

function getInitialValuesFromResult(result) {
    if (!result || typeof result !== "object") {
        return {};
    }

    const structuredData = [
        result.record,
        result.reportData,
        result.parsedData,
        result.parsedReport,
        result.formData,
        result.fields,
    ].find((value) => value && typeof value === "object" && !Array.isArray(value));

    const source = mapAIFieldsToFormFields(structuredData || result);

    return REPORT_FORM_FIELDS.reduce((initialValues, fieldName) => {
        const value = source[fieldName];
        if (value === undefined || value === null) {
            return initialValues;
        }

        initialValues[fieldName] = typeof value === "string" ? value : String(value);
        return initialValues;
    }, {});
}

export default function ReportResultBox({ result, onRetake, onClose }) {
    const { report, found, missing, warnings } = result || {};
    const [copied, setCopied] = useState(false);
    const [copiedMerged, setCopiedMerged] = useState(false);
    const { openReportFormModal } = useModalFormInitValues();
    const initialValues = getInitialValuesFromResult(result);
    const mergedPayload = buildRecordPayload(initialValues);
    const missingMergedFields = RECORD_SCHEMA.payloadFields.filter((fieldName) => {
        const value = mergedPayload[fieldName];
        return typeof value !== "string" || value.trim() === "";
    });

    const handleCopyMerged = async () => {
        const mergedText = JSON.stringify(mergedPayload, null, 2);
        try {
            await navigator.clipboard.writeText(mergedText);
            setCopiedMerged(true);
            setTimeout(() => setCopiedMerged(false), 1500);
        } catch (error) {
            const textarea = document.createElement("textarea");
            textarea.value = mergedText;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopiedMerged(true);
            setTimeout(() => setCopiedMerged(false), 1500);
        }
    };

    const handleCopy = async () => {
        if (!report) return;

        try {
            await navigator.clipboard.writeText(report);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (error) {
            const textarea = document.createElement("textarea");
            textarea.value = report;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    const handleContinueToForm = () => {
        openReportFormModal(initialValues);
        onClose?.();
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Report text */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">Báo cáo AI tạo ra</p>
                    <button
                        type="button"
                        aria-label="Sao chép báo cáo"
                        title="Sao chép báo cáo"
                        onClick={handleCopy}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-base text-foreground transition hover:bg-muted"
                    >
                        {copied ? "✓" : "⧉"}
                    </button>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground">
                    {report || "Không có nội dung báo cáo."}
                </pre>
            </div>

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <p className="mb-2 text-sm font-medium text-amber-800">
                        ⚠ Cảnh báo
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-sm text-amber-700">
                        {warnings.map((w, i) => (
                            <li key={i}>{w}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Found / Missing */}
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <p className="mb-2 text-sm font-medium text-green-800">
                        Đã tìm thấy ({found?.length || 0})
                    </p>
                    {found && found.length > 0 ? (
                        <ul className="list-inside list-disc space-y-1 text-sm text-green-700">
                            {found.map((f, i) => (
                                <li key={i}>{f}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-green-600">
                            Không có trường nào.
                        </p>
                    )}
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="mb-2 text-sm font-medium text-red-800">
                        Thiếu ({missing?.length || 0})
                    </p>
                    {missing && missing.length > 0 ? (
                        <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                            {missing.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-red-600">
                            Đầy đủ thông tin.
                        </p>
                    )}
                </div>
            </div>

            {/* Merged payload preview (ready for excel/api) */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-blue-900">
                        Dữ liệu sau khi merge (sẵn sàng điền Excel)
                    </p>
                    <button
                        type="button"
                        aria-label="Sao chép dữ liệu merge"
                        title="Sao chép dữ liệu merge"
                        onClick={handleCopyMerged}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-300 bg-white text-base text-blue-900 transition hover:bg-blue-100"
                    >
                        {copiedMerged ? "✓" : "⧉"}
                    </button>
                </div>

                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-blue-200 bg-white p-3 font-mono text-xs leading-relaxed text-blue-950">
                    {JSON.stringify(mergedPayload, null, 2)}
                </pre>

                <div className="mt-3 rounded-md border border-blue-200 bg-white p-3">
                    <p className="text-sm font-medium text-blue-900">
                        Thiếu sau merge ({missingMergedFields.length})
                    </p>
                    {missingMergedFields.length > 0 ? (
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-800">
                            {missingMergedFields.map((fieldName) => (
                                <li key={fieldName}>
                                    {(RECORD_SCHEMA.labels && RECORD_SCHEMA.labels[fieldName]) || fieldName}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-blue-700">Đủ dữ liệu cho các trường payload.</p>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onRetake}>
                        Chụp lại
                    </Button>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Đóng
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyMerged}
                    >
                        {copiedMerged ? "Đã sao chép dữ liệu merge" : "Sao chép dữ liệu merge"}
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        onClick={handleContinueToForm}
                    >
                        Tiếp tục điền form
                    </Button>
                </div>
            </div>
        </div>
    );
}

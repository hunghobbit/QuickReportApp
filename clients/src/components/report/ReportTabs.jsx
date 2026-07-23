"use client";

import { useState, useEffect, useCallback } from "react";
import ReportCard from "./ReportCard";
import { getReportsByDate, exportExcel } from "@/utils/api";

/**
 * ReportTabs — Tabs cho "Đã ra xưởng" (completed) và "Chưa ra xưởng" (pending).
 * Tải danh sách theo ngày đã chọn và theo status.
 *
 * @param {object}       props
 * @param {string}       props.reportDate - Ngày báo cáo (YYYY-MM-DD)
 * @param {(record: object) => void} props.onEdit - Callback khi bấm Chỉnh sửa
 * @param {number|null}  props.editTrigger - Giá trị thay đổi để reload (dùng để trigger sau khi lưu/sửa)
 */
export default function ReportTabs({ reportDate, onEdit, editTrigger }) {
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "completed"
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!reportDate) {
      setPending([]);
      setCompleted([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await getReportsByDate(reportDate);
      if (result.success) {
        const all = result.data || [];
        setPending(all.filter((r) => r.status === "pending"));
        setCompleted(all.filter((r) => r.status === "completed"));
      } else {
        setError(result.message || "Không thể tải danh sách.");
      }
    } catch (err) {
      setError(err.message ?? "Có lỗi khi tải danh sách.");
    } finally {
      setLoading(false);
    }
  }, [reportDate]);

  // Tải lại mỗi khi reportDate hoặc editTrigger thay đổi
  useEffect(() => {
    fetchReports();
  }, [fetchReports, editTrigger]);

  const tabs = [
    {
      key: "pending",
      label: "Chưa ra xưởng",
      count: pending.length,
      records: pending,
    },
    {
      key: "completed",
      label: "Đã ra xưởng",
      count: completed.length,
      records: completed,
    },
  ];

  const activeTabData = tabs.find((t) => t.key === activeTab);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      {/* Tab headers */}
      <div className="mb-4 flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors
              ${
                activeTab === tab.key
                  ? "text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-blue-600"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {tab.label}
            <span
              className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold
                ${
                  activeTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground"
                }
              `}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading / Error / Empty / List */}
      {loading && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Đang tải...
        </p>
      )}

      {!loading && error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          ⚠ {error}
        </div>
      )}

      {/* Nút Xuất Excel */}
      {!loading && !error && reportDate && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={async () => {
              if (exporting) return;
              setExporting(true);
              try {
                await exportExcel(reportDate);
              } catch (err) {
                setError(err.message ?? "Không thể xuất Excel.");
              } finally {
                setExporting(false);
              }
            }}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Đang xuất...
              </>
            ) : (
              <>
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Xuất Excel
              </>
            )}
          </button>
        </div>
      )}

      {!loading && !error && activeTabData && activeTabData.records.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Không có báo cáo nào ở mục "{activeTabData.label}".
        </p>
      )}

      {!loading && !error && activeTabData && activeTabData.records.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {activeTabData.records.map((record) => (
            <ReportCard
              key={record.id}
              record={record}
              isPending={activeTab === "pending"}
              onEdit={activeTab === "pending" ? onEdit : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
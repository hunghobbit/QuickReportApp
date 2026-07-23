import { useState, useCallback } from "react";
import * as ReportEls from "@/components/report"

import "./index.css";
import { DesktopTopNav } from "./components/layout/DesktopTopNav";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { ModalFormInitValuesProvider, useModalFormInitValues } from "./contexts/ExportContext";
import ReportDatePicker from "./components/report/ReportDatePicker";

function AppContent() {
  const { reportDate, setReportDate } = useModalFormInitValues();

  // State cho chỉnh sửa: bản ghi đang edit và trigger reload danh sách
  const [editRecord, setEditRecord] = useState(null);
  const [editTrigger, setEditTrigger] = useState(0);

  const handleEdit = useCallback((record) => {
    // Nhận toàn bộ record từ card để điền vào form chỉnh sửa
    setEditRecord(record);
  }, []);

  const handleSaved = useCallback(() => {
    // Tăng trigger để reload danh sách
    setEditTrigger((prev) => prev + 1);
    // Reset editRecord - dùng setTimeout để tránh race condition với closeModal
    setTimeout(() => setEditRecord(null), 100);
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditRecord(null);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DesktopTopNav />

      <main className="flex flex-1 flex-col px-6 pb-24 pt-6 md:px-8 md:pb-8 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo</h1>
          <div className="flex items-center gap-4">
            <ReportDatePicker date={reportDate} onChange={setReportDate} />
            <ReportEls.CreateReportButton />
          </div>
        </div>
        <div className="mt-6">
          <ReportEls.ReportFormModal
            editRecord={editRecord}
            onSaved={handleSaved}
            onClose={handleCloseModal}
          />

          <ReportEls.ReportTabs
            reportDate={reportDate}
            onEdit={handleEdit}
            editTrigger={editTrigger}
          />
        </div>
      </main>

      <MobileBottomNav />
      <ReportEls.ReportChat />
    </div>
  );
}

const App = () => {
  return (
    <ModalFormInitValuesProvider>
      <AppContent />
    </ModalFormInitValuesProvider>
  );
};
export default App;
import { useState, useCallback, useEffect } from "react";
import * as ReportEls from "@/components/report"
import AIReportGenerator from "@/components/ai/AIReportGenerator";

import "./index.css";
import { DesktopTopNav } from "./components/layout/DesktopTopNav";
import { MobileBottomNav } from "./components/layout/MobileBottomNav";
import { ModalFormInitValuesProvider, useModalFormInitValues } from "./contexts/ExportContext";
import { useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./components/auth";
import ReportDatePicker from "./components/report/ReportDatePicker";

function AppContent() {
  const { reportDate, setReportDate } = useModalFormInitValues();

  // State cho chỉnh sửa: bản ghi đang edit và trigger reload danh sách
  const [editRecord, setEditRecord] = useState(null);
  const [editTrigger, setEditTrigger] = useState(0);

  // State cho xem chi tiết (chỉ đọc) báo cáo đã ra xưởng
  const [viewRecord, setViewRecord] = useState(null);

  const handleEdit = useCallback((record) => {
    // Nhận toàn bộ record từ card để điền vào form chỉnh sửa
    setEditRecord(record);
  }, []);

  const handleView = useCallback((record) => {
    // Mở modal xem chi tiết (chỉ đọc) cho báo cáo đã ra xưởng
    setViewRecord(record);
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

  const handleCloseView = useCallback(() => {
    setViewRecord(null);
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

          <ReportEls.ReportViewModal
            viewRecord={viewRecord}
            onClose={handleCloseView}
          />

          <ReportEls.ReportTabs
            reportDate={reportDate}
            onEdit={handleEdit}
            onView={handleView}
            editTrigger={editTrigger}
          />
        </div>
      </main>

      <MobileBottomNav />
      <AIReportGenerator />
    </div>
  );
}

const App = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("light");
    document.documentElement.classList.remove("dark");

    return () => {
      document.documentElement.classList.remove("light");
    };
  }, []);

  // Nếu chưa đăng nhập → hiển thị trang đăng nhập
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <ModalFormInitValuesProvider>
      <AppContent />
    </ModalFormInitValuesProvider>
  );
};
export default App;

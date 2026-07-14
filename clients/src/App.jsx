import { DesktopTopNav } from "@/components/desktop-top-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { CreateReportButton } from "@/components/create-report-button";
import { ReportChat } from "@/components/report-chat";
import { ReportFormModal } from "@/components/report";

import "./index.css";

const App = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DesktopTopNav />

      <main className="flex flex-1 flex-col px-6 pb-24 pt-6 md:px-8 md:pb-8 md:pt-8">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo</h1>
          <div className="mt-5">
            <CreateReportButton />
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <ReportFormModal />

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Hướng dẫn</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>• Điền các trường bắt buộc để tạo báo cáo.</li>
              <li>• Nhấn Xuất Excel để tải file về máy.</li>
              <li>• Backend sẽ dùng dữ liệu này để tạo template báo cáo.</li>
            </ul>
          </div>
        </div>
      </main>

      <MobileBottomNav />
      <ReportChat />
    </div>
  );
};
export default App;

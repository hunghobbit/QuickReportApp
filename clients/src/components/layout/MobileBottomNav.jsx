"use client"

import { Home, User, Plus } from "lucide-react"
import { openReportChat } from "@/components/report/ReportChat"

export function MobileBottomNav() {
  return (
    <nav
      aria-label="Thanh điều hướng dưới cùng"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background md:hidden"
    >
      <div className="relative flex h-16 items-center justify-between px-10 pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Home className="size-6" aria-hidden="true" />
          <span className="text-[11px] font-medium">Trang chủ</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <User className="size-6" aria-hidden="true" />
          <span className="text-[11px] font-medium">Tài khoản</span>
        </button>

        {/* Floating action button, centered on the bar */}
        <button
          type="button"
          onClick={openReportChat}
          aria-label="Tạo báo cáo mới"
          className="absolute left-1/2 top-0 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-crimson text-crimson-foreground shadow-lg shadow-crimson/30 ring-4 ring-background transition-transform active:scale-95"
        >
          <Plus className="size-8" strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
    </nav>
  )
}

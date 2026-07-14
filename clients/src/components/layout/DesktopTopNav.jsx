import { FileText } from "lucide-react"

export function DesktopTopNav() {
  return (
    <header className="hidden bg-crimson text-crimson-foreground md:block">
      <nav className="flex h-16 items-center gap-3 px-6 lg:px-8" aria-label="Điều hướng chính">
        <FileText className="size-5 shrink-0" aria-hidden="true" />
        <span className="text-base font-semibold tracking-tight text-balance">
          Trang chủ - Tạo báo cáo mới
        </span>
      </nav>
    </header>
  )
}

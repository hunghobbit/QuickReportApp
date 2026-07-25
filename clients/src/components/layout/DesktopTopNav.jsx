import { FileText, LogOut } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export function DesktopTopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="hidden bg-crimson text-crimson-foreground md:block">
      <nav className="flex h-16 items-center justify-between gap-3 px-6 lg:px-8" aria-label="Điều hướng chính">
        <div className="flex items-center gap-3">
          <FileText className="size-5 shrink-0" aria-hidden="true" />
          <span className="text-base font-semibold tracking-tight text-balance">
            Trang chủ - Tạo báo cáo mới
          </span>
        </div>

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {user.name}
            </span>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1 rounded-md px-3 py-1 text-sm font-medium hover:bg-crimson/90"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        )}
      </nav>
    </header>
  )
}

"use client"

import { Plus } from "lucide-react"
import  Button  from "../ui/button"
import { openReportChat } from "./ReportChat"

export default function CreateReportButton() {
  return (
    <Button
      size="lg"
      onClick={openReportChat}
      className="h-12 gap-2 bg-crimson px-6 text-base font-semibold text-crimson-foreground hover:bg-crimson/90"
    >
      <Plus className="size-5" strokeWidth={2.5} aria-hidden="true" />
      Tạo báo cáo mới
    </Button>
  )
}

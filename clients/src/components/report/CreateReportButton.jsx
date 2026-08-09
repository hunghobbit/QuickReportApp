"use client"

import { Plus } from "lucide-react"
import  Button  from "../ui/button"
import { openAIReportGenerator } from "@/components/ai/AIReportGenerator"

export default function CreateReportButton() {
  return (
    <Button
      size="lg"
      onClick={openAIReportGenerator}
    //   make it hidden on small screens
      className="h-12 gap-2 bg-crimson px-6 text-base font-semibold text-crimson-foreground hover:bg-crimson/90 sm:hidden md:flex"
    >
      <Plus className="size-5" strokeWidth={2.5} aria-hidden="true" />
      Tạo báo cáo mới
    </Button>
  )
}

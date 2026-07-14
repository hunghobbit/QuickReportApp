import { RECORD_SCHEMA } from "./record-schema";

export const LABELS = RECORD_SCHEMA.labels;

export const PERSON_FIELDS = {
  stt: "STT\n\nNo.",
  soThe: "Số thẻ\n\nCard No.",
  hoTen: "Họ Tên\n\nFull Name",
  thuocCtyDonVi: "Thuộc Cty/Đơn vị\n\nCompany",
  bks: "Loại phương tiện - BSX\n\nVehicle - Plat No.",
  id: "Loại Giấy Tờ - Số giấy tờ\n\nLiciense - No.",
  liDoRaVaoCong:
    "Lý do ra vào xưởng - Người liên hệ\n\nReason for in/out - Contact Person",
  gioVao: "Giờ vào\nKý tên\n\nTime in\nSign",
  gioRa: "Giờ ra\nKý tên\n\nTime out\nSign",
  ghiChu: "Ghi chú\n\nNotes",
};

export const GOODS_FIELDS = {
  stt: "STT\n\nNo.",
  hoTen_ThuocCtyDonVi: "Họ Tên - Thuộc Cty/Đơn vị\n\nFull Name - Company",
  xuongGiao: "Xưởng Giao\n\nDelivery Company",
  xuongNhan: "Xưởng Nhận\n\nReceived Company",
  soThe: "Số thẻ\n\nCard No.",
  id: "Loại Giấy Tờ - Số giấy tờ\n\nLiciense - No.",
  loaiPhuongTien_BSX_BKSRomooc: "Loại phương tiện - BSX/BKS Romooc\n\nVehicle - Plat No.",
  soCont_SoSeal: "Số cont - Số seal\n\nContainer No. - Seal No.",
  chiTietHangHoa:
    "Tên hàng hóa - Đơn vị - Số lượng\n\nGoods name - Type - Quantity",
  soPhieu: "Số Phiếu Xuất/Nhập\n\nGD/RN",
  gioVao: "Giờ vào\nKý tên\n\nTime in\nSign",
  gioRa: "Giờ ra\nKý tên\n\nTime out\nSign",
  ghiChu: "Ghi chú\n\nNotes",
};

export const FIELD_ALIASES = {
  hoTen: ["Họ tên", "Họ Tên", "Full Name", "Name", "Họ và tên", "Tên", "Tài xế", "NMH", "Người mang hàng"],
  thuocCtyDonVi: ["Cty", "Công ty", "Company", "Công ty/Đơn vị","Cty/Đơn vị"],
  liDoRaVaoCong: ["Lý do", "Mục đích", "Reason", "Purpose"],
  chiTietHangHoa: ["Chủng loại/Số lượng", 'Chủng loại', "số lượng", "goods details"],
  soCont : ["Số Cont", "Số cont", "Số thùng cont", "cont no.", "Cont No."],
  soSeal : ["Số Seal", "Số seal", "Seal", "seal"],
  gioVao: ["Giờ vào", "Thời gian vào", "Time in", "Vào", "Vào cổng lúc"],
  gioRa: ["Giờ ra", "Thời gian ra", "Time out", "Ra", "Ra cổng lúc", "rời", "Rời"],
  nguoiLienHe: ["Người liên hệ", "Contact Person", "liên hệ", "Người nhận hàng"],
  soPhieu:["BPMs", "Phiếu MHRC", "BPM"],
  loaiPhuongTien: ["Phương tiện", "Loại xe"],
  bks: ["BSX", "bsx", "Bsx", "BKS", "Bks", "bks","Plate No.", "Biển số xe", "Biển Số Xe"],
  bksRomooc : ["Rơ-mooc", "Rơ móc", "Rơ-móc", "ro mooc", "rơ-mooc", "Rơ Mooc"],
  id: ["cccd", "CCCD/GPLX", "Cccd", "GPLX", "BST", "Số thẻ", "MST", "VAT", "Employee ID"],
  xuongGiao: ["cty", "Cty/Đơn vị", "Công ty", "Giao", "Xưởng Xuất", "Xưởng nhập", "xưởng nhập", "xưởng Nhập", "Delivery", "Export Factory"],
  xuongNhan : ["cty", "Cty/Đơn vị", "Công ty", "Nhận", "Xưởng Nhập", "Received", "Import Factory"]
};

function joinNonEmptyValues(values = []) {
  return values
    .filter((value) => value !== null && value !== undefined && `${value}`.trim() !== '')
    .join(' - ');
}



export function buildTempRecordFromSupplementaryValues(values = {}) {
  const normalizedValues = { ...values };

  return {
    stt: normalizedValues.stt ?? '',
    hoTen_ThuocCtyDonVi: joinNonEmptyValues([
      normalizedValues.hoTen,
      normalizedValues.thuocCtyDonVi,
    ]),
    xuongGiao: normalizedValues.xuongGiao ?? '',
    xuongNhan: normalizedValues.xuongNhan ?? '',
    soThe: normalizedValues.soThe ?? '',
    id: normalizedValues.id ?? '',
    loaiPhuongTien_BSX_BKSRomooc: joinNonEmptyValues([
      normalizedValues.loaiPhuongTien,
      normalizedValues.bks,
      normalizedValues.bksRomooc,
    ]),
    soCont_SoSeal: joinNonEmptyValues([
      normalizedValues.soCont,
      normalizedValues.soSeal,
    ]),
    chiTietHangHoa: normalizedValues.chiTietHangHoa ?? '',
    soPhieu: normalizedValues.soPhieu ?? '',
    gioVao: normalizedValues.gioVao ?? '',
    gioRa: normalizedValues.gioRa ?? '',
    ghiChu: normalizedValues.ghiChu ?? '',
  };
}

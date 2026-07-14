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


/**
 * Truyền vào 1 object và 1 mảng tên thuộc tính (fields) cần kiểm tra.
 * Trả về mảng các field bị "trống" trong object (theo đúng danh sách trong mảng).
 *
 * "Trống" ở đây nghĩa là: undefined, null, hoặc chuỗi rỗng sau khi trim.
 * (giống cách checkIsValid/requiredPayloadFields trong project của bạn đang dùng)
 *
 * @param {Object} obj - object cần kiểm tra
 * @param {string[]} fields - danh sách tên thuộc tính cần đối chiếu
 * @returns {string[]} danh sách field còn thiếu/trống
 */
export function getEmptyFields(obj = {}, fields = []) {
  return fields.filter((field) => {
    const value = obj[field];
    if (value === undefined || value === null) return true;
    if (typeof value === "string") return value.trim() === "";
    return false;
  });
}
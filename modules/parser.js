import { FIELD_ALIASES } from "./config.js";

export function getFieldValueFromLine(line, aliases = []) {
  const normalizedLine = line.trim();
  const matchesAlias = aliases.some((alias) =>
    normalizedLine.toLowerCase().includes(alias.toLowerCase()),
  );

  if (!matchesAlias) return null;

  const separatorIndex = normalizedLine.indexOf(":");
  return separatorIndex >= 0
    ? normalizedLine.slice(separatorIndex + 1).trim()
    : "";
}

export function parseReportText(reportText) {
  const lines = reportText.split("\n");
  const rawFields = {
    stt: "",
    hoTen: "",
    thuocCtyDonVi :"",
    xuongGiao: "",
    xuongNhan: "",
    soThe: "",
    id: "",
    loaiPhuongTien:"",
    bks: "",
    bksRomooc:"",
    soCont:"",
    soSeal:"",
    chiTietHangHoa: "",
    soPhieu: "",
    gioVao: "",
    gioRa: "",
    ghiChu: "",
  };

  lines.forEach((line) => {
    const hoTenValue = getFieldValueFromLine(line, FIELD_ALIASES.hoTen);
    if (hoTenValue !== null) rawFields.hoTen = hoTenValue;

    const companyValue = getFieldValueFromLine(
      line,
      FIELD_ALIASES.thuocCtyDonVi,
    );
    if (companyValue !== null) rawFields.thuocCtyDonVi = companyValue;

    // const reasonValue = getFieldValueFromLine(
    //   line,
    //   FIELD_ALIASES.liDoRaVaoCong,
    // );
    // if (reasonValue !== null) rawFields.liDoRaVaoCong = reasonValue;

    const timeInValue = getFieldValueFromLine(line, FIELD_ALIASES.gioVao);
    if (timeInValue !== null) rawFields.gioVao = timeInValue;

    const timeOutValue = getFieldValueFromLine(line, FIELD_ALIASES.gioRa);
    if (timeOutValue !== null) rawFields.gioRa = timeOutValue;

    const contactValue = getFieldValueFromLine(line, FIELD_ALIASES.nguoiLienHe);
    if (contactValue !== null) rawFields.nguoiLienHe = contactValue;

    const goodsDetailsValue = getFieldValueFromLine(line, FIELD_ALIASES.chiTietHangHoa);
    if (goodsDetailsValue !== null) rawFields.chiTietHangHoa = goodsDetailsValue;

    const vehicleValue = getFieldValueFromLine(line, FIELD_ALIASES.loaiPhuongTien);
    if (vehicleValue !== null) rawFields.loaiPhuongTien = vehicleValue;

    const plateNumberValue = getFieldValueFromLine(line, FIELD_ALIASES.bks);
    if (plateNumberValue !== null) rawFields.bks = plateNumberValue;
    console.log(plateNumberValue);
    

    const romockPlateNumberValue = getFieldValueFromLine(line, FIELD_ALIASES.bksRomooc);
    if (romockPlateNumberValue !== null) rawFields.bksRomooc = romockPlateNumberValue;

    const deliveryFactoryValue = getFieldValueFromLine(line, FIELD_ALIASES.xuongGiao);
    if (deliveryFactoryValue !== null) rawFields.xuongGiao = deliveryFactoryValue;

    const recievedFactoryValue = getFieldValueFromLine(line, FIELD_ALIASES.xuongNhan);
    if (recievedFactoryValue !== null) rawFields.xuongNhan = recievedFactoryValue;

    const containerNumberValue = getFieldValueFromLine(line, FIELD_ALIASES.soCont);
    if (containerNumberValue !== null) rawFields.soCont = containerNumberValue;

    const sealNumberValue = getFieldValueFromLine(line, FIELD_ALIASES.soSeal);
    if (sealNumberValue !== null) rawFields.soSeal = sealNumberValue;

    const deliveryNoteNumberValue = getFieldValueFromLine(line, FIELD_ALIASES.soPhieu);
    if (deliveryNoteNumberValue !== null) rawFields.soPhieu = deliveryNoteNumberValue;
  });

  return rawFields;
}

import Joi from "joi";

const requiredText = Joi.string().trim().min(1).required();
const optionalText = Joi.string().trim().empty("").optional();
const timePattern = /^(?:[01]?\d|2[0-3])[:.][0-5]\d(?::[0-5]\d)?$/;

// Keep validation rules next to the report domain instead of scattering them
// throughout form components. Empty optional inputs are omitted from the
// validated value; the existing payload builder handles absent fields.
export const reportFormSchema = Joi.object({
  stt: Joi.string().trim().pattern(/^\d+$/).required().messages({
    "string.empty": "Số thứ tự là bắt buộc.",
    "string.pattern.base": "Số thứ tự chỉ được chứa chữ số.",
    "any.required": "Số thứ tự là bắt buộc.",
  }),
  hoTen: optionalText,
  thuocCtyDonVi: optionalText,
  xuongGiao: requiredText.messages({ "string.empty": "Xưởng xuất là bắt buộc." }),
  xuongNhan: requiredText.messages({ "string.empty": "Xưởng nhập là bắt buộc." }),
  soThe: requiredText.messages({ "string.empty": "Số thẻ là bắt buộc." }),
  id: optionalText,
  loaiPhuongTien: optionalText,
  bks: optionalText,
  bksRomooc: optionalText,
  soCont: optionalText,
  soSeal: optionalText,
  chiTietHangHoa: requiredText.messages({
    "string.empty": "Chi tiết hàng hóa là bắt buộc.",
  }),
  soPhieu: requiredText.messages({ "string.empty": "Số phiếu là bắt buộc." }),
  gioVao: Joi.string().trim().pattern(timePattern).required().messages({
    "string.empty": "Giờ vào là bắt buộc.",
    "string.pattern.base": "Giờ vào phải theo định dạng HH:mm.",
  }),
  gioRa: Joi.string().trim().pattern(timePattern).required().messages({
    "string.empty": "Giờ ra là bắt buộc.",
    "string.pattern.base": "Giờ ra phải theo định dạng HH:mm.",
  }),
  ghiChu: optionalText,
})
  .or("hoTen", "thuocCtyDonVi")
  .or("loaiPhuongTien", "bks", "bksRomooc")
  .messages({
    "object.missing": "Điền họ tên hoặc đơn vị, và thông tin phương tiện hoặc biển số xe.",
  });

export function validateReportForm(values) {
  return reportFormSchema.validate(values, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });
}

export function getReportFormErrors(values) {
  const { error } = validateReportForm(values);
  if (!error) return {};

  return error.details.reduce((errors, detail) => {
    const fieldName = detail.path[0];
    if (fieldName && !errors[fieldName]) errors[fieldName] = detail.message;
    return errors;
  }, {});
}

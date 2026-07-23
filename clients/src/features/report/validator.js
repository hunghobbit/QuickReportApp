import Joi from "joi";

const requiredText = Joi.string().trim().min(1).required();
const optionalText = Joi.string().trim().empty("").optional();
const timePattern = /^(?:[01]?\d|2[0-3])[:.][0-5]\d(?::[0-5]\d)?$/;

// Shared base fields — used by both draft and complete schemas.
const baseFields = {
  stt: Joi.string().trim().pattern(/^\d+$/).required().messages({
    "string.empty": "Số thứ tự là bắt buộc.",
    "string.pattern.base": "Số thứ tự chỉ được chứa chữ số.",
    "any.required": "Số thứ tự là bắt buộc.",
  }),
  hoTen: optionalText,
  thuocCtyDonVi: optionalText,
  xuongGiao: requiredText.messages({
    "string.empty": "Xưởng xuất là bắt buộc.",
  }),
  xuongNhan: requiredText.messages({
    "string.empty": "Xưởng nhập là bắt buộc.",
  }),
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
  soPhieu: requiredText.messages({
    "string.empty": "Số phiếu là bắt buộc.",
  }),
  gioVao: Joi.string().trim().pattern(timePattern).required().messages({
    "string.empty": "Giờ vào là bắt buộc.",
    "string.pattern.base": "Giờ vào phải theo định dạng HH:mm.",
  }),
  gioRa: Joi.string().trim().pattern(timePattern).messages({
    "string.empty": "Giờ ra là bắt buộc.",
    "string.pattern.base": "Giờ ra phải theo định dạng HH:mm.",
  }),
  ghiChu: optionalText,
};

// Draft schema: gioRa is optional (status will be "pending").
export const reportDraftFormSchema = Joi.object({
  ...baseFields,
  gioRa: Joi.string().trim().pattern(timePattern).optional().allow("").messages({
    "string.pattern.base": "Giờ ra phải theo định dạng HH:mm.",
  }),
})
  .or("hoTen", "thuocCtyDonVi")
  .or("loaiPhuongTien", "bks", "bksRomooc")
  .messages({
    "object.missing":
      "Điền họ tên hoặc đơn vị, và thông tin phương tiện hoặc biển số xe.",
  });

// Complete schema: gioRa is required (status will be "completed").
export const reportCompleteFormSchema = Joi.object({
  ...baseFields,
  gioRa: Joi.string().trim().pattern(timePattern).required().messages({
    "string.empty": "Giờ ra là bắt buộc.",
    "string.pattern.base": "Giờ ra phải theo định dạng HH:mm.",
  }),
})
  .or("hoTen", "thuocCtyDonVi")
  .or("loaiPhuongTien", "bks", "bksRomooc")
  .messages({
    "object.missing":
      "Điền họ tên hoặc đơn vị, và thông tin phương tiện hoặc biển số xe.",
  });

// Backwards-compatible alias for the complete schema.
export const reportFormSchema = reportCompleteFormSchema;

/**
 * Validate a report form.
 *
 * @param {object} values - The form values.
 * @param {"draft"|"complete"} mode - "draft" allows empty gioRa;
 *   "complete" requires a valid gioRa.
 * @returns Joi validation result.
 */
export function validateReportForm(values, mode = "complete") {
  const schema =
    mode === "draft" ? reportDraftFormSchema : reportCompleteFormSchema;
  return schema.validate(values, {
    abortEarly: false,
    convert: true,
    stripUnknown: true,
  });
}

/**
 * Get field-level errors from a validation result.
 *
 * @param {object} values - The form values.
 * @param {"draft"|"complete"} mode - Validation mode.
 * @returns {object} Map of field name → error message.
 */
export function getReportFormErrors(values, mode = "complete") {
  const { error } = validateReportForm(values, mode);
  if (!error) return {};

  return error.details.reduce((errors, detail) => {
    const fieldName = detail.path[0];
    if (fieldName && !errors[fieldName]) errors[fieldName] = detail.message;
    return errors;
  }, {});
}

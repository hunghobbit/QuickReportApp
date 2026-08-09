import Joi from "joi";

const requiredText = Joi.string().trim().min(1).required();
const optionalText = Joi.string().trim().empty("").optional();
const timePattern = /^(?:[01]?\d|2[0-3])[:.][0-5]\d(?::[0-5]\d)?$/;

// Shared base fields — used by both draft and complete schemas.
const baseFields = {
  stt: Joi.string().trim().pattern(/^\d+$/).optional().allow("").messages({
    "string.pattern.base": "Số thứ tự chỉ được chứa chữ số.",
  }),
  hoTen: requiredText.messages({
    "string.empty": "Họ tên là bắt buộc.",
  }),
  thuocCtyDonVi: requiredText.messages({
    "string.empty": "Tên đơn vị là bắt buộc.",
  }),
  xuongGiao: optionalText,
  xuongNhan: optionalText,
  soThe: optionalText,
  id: requiredText.messages({
    "string.empty": "Giấy tờ là bắt buộc.",
  }),
  loaiPhuongTien: requiredText.messages({
    "string.empty": "Phương tiện là bắt buộc.",
  }),
  bks: optionalText,
  bksRomooc: optionalText,
  soCont: optionalText,
  soSeal: optionalText,
  chiTietHangHoa: optionalText,
  soPhieu: optionalText,
  gioVao: Joi.string().trim().pattern(timePattern).optional().allow("").messages({
    "string.pattern.base": "Giờ vào phải theo định dạng HH:mm.",
  }),
  gioRa: Joi.string().trim().pattern(timePattern).optional().allow("").messages({
    "string.pattern.base": "Giờ ra phải theo định dạng HH:mm.",
  }),
  ghiChu: optionalText,
};

export const reportDraftFormSchema = Joi.object({
  ...baseFields,
});

export const reportCompleteFormSchema = Joi.object({
  ...baseFields,
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

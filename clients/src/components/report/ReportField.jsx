const textareaFields = ["chiTietHangHoa", "ghiChu"];

export default function ReportField({
  name,
  label,
  value,
  onChange,
}) {
  const isTextarea = textareaFields.includes(name);

  if (isTextarea) {
    return (
      <label>
        <span>{label}</span>
        <textarea name={name} value={value} onChange={onChange} />
      </label>
    );
  }

  return (
    <label>
      <span>{label}</span>
      <input name={name} value={value} onChange={onChange} />
    </label>
  );
}

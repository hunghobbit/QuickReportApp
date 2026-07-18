const textareaFields = ["chiTietHangHoa", "ghiChu"];

export default function ReportField({
  name,
  label,
  value,
  onChange,
  error,
}) {
  const isTextarea = textareaFields.includes(name);

  if (isTextarea) {
    return (
      <label>
        <span>{label}</span>
        <textarea name={name} value={value} onChange={onChange} aria-invalid={Boolean(error)} />
        {error && <span className="text-sm text-red-600">{error}</span>}
      </label>
    );
  }

  return (
    <label>
      <span>{label}</span>
      <input name={name} value={value} onChange={onChange} aria-invalid={Boolean(error)} />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

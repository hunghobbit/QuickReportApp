const textareaFields = ["chiTietHangHoa", "ghiChu"];

const fieldClassName =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

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
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          className={`${fieldClassName} min-h-24 resize-y`}
        />
        {error && <span className="text-sm text-red-600">{error}</span>}
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={fieldClassName}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

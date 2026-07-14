import { RECORD_SCHEMA } from "@/config/record-schema";
import ReportField from "./ReportField";

export default function ReportForm({ form, setForm }) {
  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,

      [name]: value,
    }));
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {RECORD_SCHEMA.formFields.map((name) => (
        <ReportField
          key={name}
          name={name}
          label={RECORD_SCHEMA.labels[name]}
          value={form[name]}
          onChange={handleChange}
        />
      ))}
    </div>
  );
}

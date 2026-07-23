// Re-export from the shared schema so that `configs/record-schema.js`
// remains the single source of truth for every label and alias.
import { RECORD_SCHEMA } from "@/config/record-schema";

export { RECORD_SCHEMA };

export const LABELS = RECORD_SCHEMA.labels;
export const FIELD_ALIASES = RECORD_SCHEMA.textAliases;

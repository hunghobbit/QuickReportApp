// server/ai/index.js
// Entry point for the AI Report Generator module.
// Exports all sub-modules for easy import from app.js and other services.
//
// Architecture (from ChatGPT conversation):
//   server/ai/
//   ├── prompt.js          — System prompt (fixed, in code)
//   ├── buildInput.js      — Build structured JSON input for LLM
//   ├── ai.service.js      — Call Google GenAI API
//   ├── report-parser.js   — Parse AI output into structured fields
//   ├── validator.js       — Validate fields, produce warnings
//   └── index.js           — This file (barrel export)

export { prompt } from "./prompt.js";
export { buildInput, buildPromptMessages, buildReportTemplate } from "./buildInput.js";
export { generateReport, generateReportFromImages, isAIConfigured } from "./ai.service.js";
export { parseReportFromAI, mapAIFieldsToRecord } from "./report-parser.js";
export { validateReportFields, ALL_FIELDS } from "./validator.js";

// Default export: the main service function
export { generateReport as default } from "./ai.service.js";
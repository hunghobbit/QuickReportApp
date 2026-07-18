import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);  

export async function loadTemplate(templateName) {
  // Call API 'template-loader'
  const response = await fetch(`/api/template-loader?name=${templateName}`);
  if (!response.ok) {
    throw new Error(`Failed to load template: ${response.statusText}`);
  }
  return await response.json();
}

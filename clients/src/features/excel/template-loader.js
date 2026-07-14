import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);  

export async function loadTemplate(templateName) {
  const filePath = path.join(
    __dirName,
    "..",
    "__xlsx",
    `${templateName}_Template.xlsx`,
  );
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

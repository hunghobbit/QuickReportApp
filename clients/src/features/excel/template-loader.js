import path from "path";
import { fileURLToPath } from "url";

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);  

export async function loadTemplate(templateName) {
  // Call API 'template-loader'
  const response = await fetch(`/api/template-loader?name=${templateName}`);
  if (!response.ok) {
    let errorMessage = `Failed to load template: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If response is not JSON, use default message
    }
    throw new Error(errorMessage);
  }
  return await response.json();
}

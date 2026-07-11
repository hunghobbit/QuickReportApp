import { parseReportText } from "./modules/parser.js";
import { createModalController } from "./modules/modal.js";
import { checkIsValid } from "./modules/utils.js";

let rawReportText = null;
let scanBtn = null;
let submitBtn = null;
let tempRecord = {};

const modalController = createModalController({
  onSubmit: async (values) => {
    tempRecord = { ...values };
    console.log("Accepted:", tempRecord);
    await submitRecord();
  },
});

async function submitRecord() {
  try {
    const response = await fetch("http://localhost:3000/api/write-record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tempRecord)
    });

    if (!response.ok) {
      // Log the status to understand why it failed (e.g., 404, 500)
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("Content-Disposition") || "";
    const filenameMatch = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
    const filename = filenameMatch?.[1] || "quick-report.xlsx";

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    console.log("Downloaded file:", filename, blob.size);
  } catch (err) {
    console.error("Error:", err);
  }
}

function initApp() {
  rawReportText = document.getElementById("rawReport");
  scanBtn = document.getElementById("scanBtn");
  submitBtn = document.getElementById("submit-record");

  if (!scanBtn || !rawReportText) return;

  scanBtn.addEventListener("click", function () {
    console.log("scanning");
    console.log(rawReportText.value);

    if (rawReportText.value === "") {
      alert("Chưa nhập báo cáo thô!");
      console.log("Raw report is empty!");
      return;
    }

    tempRecord = parseReportText(rawReportText.value);
    console.log(tempRecord);
    modalController.open(tempRecord);
  });
}

document.addEventListener("DOMContentLoaded", initApp);

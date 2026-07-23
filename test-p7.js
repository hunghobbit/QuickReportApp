// Test script for P7 features
import http from "http";

const BASE_URL = "http://localhost:3000";

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test cases
async function runTests() {
  console.log("🧪 Bắt đầu test P7 features...\n");

  // Test 1: Check export history for a date (should be empty initially)
  console.log("Test 1: Lấy lịch sử xuất (ban đầu rỗng)");
  const history1 = await makeRequest("GET", "/api/reports/export/history/2024-12-23");
  console.log(`  Status: ${history1.status}`);
  console.log(`  Data: ${JSON.stringify(history1.data, null, 2)}\n`);

  // Test 2: Try to export manually (should work)
  console.log("Test 2: Xuất Excel thủ công (manual)");
  try {
    const exportResult = await makeRequest("GET", "/api/reports/export/2024-12-23");
    console.log(`  Status: ${exportResult.status}`);
    if (exportResult.status === 200) {
      console.log(`  ✅ Xuất thành công: ${exportResult.data.fileName}`);
    } else {
      console.log(`  ❌ Lỗi: ${exportResult.data.message}`);
    }
  } catch (error) {
    console.log(`  ❌ Exception: ${error.message}`);
  }
  console.log();

  // Test 3: Check history again (should have 1 entry)
  console.log("Test 3: Lấy lịch sử xuất (sau khi xuất 1 lần)");
  const history2 = await makeRequest("GET", "/api/reports/export/history/2024-12-23");
  console.log(`  Status: ${history2.status}`);
  console.log(`  Số lượt xuất: ${history2.data.data?.length || 0}`);
  if (history2.data.data && history2.data.data.length > 0) {
    console.log(`  Lượt xuất gần nhất:`);
    console.log(`    - Loại: ${history2.data.data[0].exportType}`);
    console.log(`    - Trạng thái: ${history2.data.data[0].status}`);
    console.log(`    - File: ${history2.data.data[0].fileName}`);
  }
  console.log();

  // Test 4: Try to export automatic (should fail - duplicate prevention)
  console.log("Test 4: Thử xuất tự động (automatic) - phải bị chặn");
  try {
    // We need to call the service directly since the API doesn't support automatic export yet
    const { exportDayReport } = await import("./services/excel-export.js");
    try {
      await exportDayReport("2024-12-23", "automatic");
      console.log(`  ❌ Không được phép xuất trùng!`);
    } catch (error) {
      console.log(`  ✅ Đã chặn xuất trùng: ${error.message}`);
    }
  } catch (error) {
    console.log(`  ❌ Exception: ${error.message}`);
  }
  console.log();

  // Test 5: Get history by date range
  console.log("Test 5: Lấy lịch sử theo khoảng ngày");
  const historyRange = await makeRequest("GET", "/api/reports/export/history?startDate=2024-12-01&endDate=2024-12-31");
  console.log(`  Status: ${historyRange.status}`);
  console.log(`  Số lượt xuất: ${historyRange.data.data?.length || 0}\n`);

  console.log("✅ Test hoàn tất!");
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
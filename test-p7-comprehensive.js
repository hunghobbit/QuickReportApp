// Comprehensive test script for P7 features
import http from "http";
import { createReport } from "./services/report-service.js";
import { exportDayReport } from "./services/excel-export.js";

const BASE_URL = "http://localhost:3000";

// Helper function to make HTTP requests
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
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

// Create test data
async function createTestData() {
  console.log("📝 Tạo dữ liệu test...\n");
  
  const testReports = [
    {
      reportDate: "2024-12-25",
      stt: "1",
      hoTen_ThuocCtyDonVi: "Nguyễn Văn A - Công ty ABC",
      xuongGiao: "Xưởng 1",
      xuongNhan: "Xưởng 2",
      soThe: "12345",
      businessId: "CMND-123456789",
      loaiPhuongTien_BSX_BKSRomooc: "Xe tải - 30A-12345",
      soCont_SoSeal: "CONT-001 - SEAL-001",
      chiTietHangHoa: "Hàng hóa A - 100kg",
      soPhieu: "PH-001",
      gioVao: "08:00",
      gioRa: "17:00",
      ghiChu: "Ghi chú test 1",
      rawText: "Test raw text 1",
    },
    {
      reportDate: "2024-12-25",
      stt: "2",
      hoTen_ThuocCtyDonVi: "Trần Thị B - Công ty XYZ",
      xuongGiao: "Xưởng 2",
      xuongNhan: "Xưởng 3",
      soThe: "67890",
      businessId: "CCCD-987654321",
      loaiPhuongTien_BSX_BKSRomooc: "Xe con - 30B-67890",
      soCont_SoSeal: "CONT-002",
      chiTietHangHoa: "Hàng hóa B - 50kg",
      soPhieu: "PH-002",
      gioVao: "09:30",
      gioRa: "18:00",
      ghiChu: "Ghi chú test 2",
      rawText: "Test raw text 2",
    },
    {
      reportDate: "2024-12-26",
      stt: "1",
      hoTen_ThuocCtyDonVi: "Lê Văn C - Công ty DEF",
      xuongGiao: "Xưởng 1",
      xuongNhan: "Xưởng 2",
      soThe: "11111",
      businessId: "Hộ chiếu-111111",
      loaiPhuongTien_BSX_BKSRomooc: "Xe máy - 30C-11111",
      soCont_SoSeal: "CONT-003",
      chiTietHangHoa: "Hàng hóa C - 20kg",
      soPhieu: "PH-003",
      gioVao: "10:00",
      gioRa: "", // pending - no gioRa
      ghiChu: "Ghi chú test 3",
      rawText: "Test raw text 3",
    },
  ];

  for (const report of testReports) {
    const result = await createReport(report);
    if (result.success) {
      console.log(`  ✅ Tạo báo cáo: ${report.reportDate} - STT ${report.stt} - ${report.hoTen_ThuocCtyDonVi}`);
    } else {
      console.log(`  ❌ Lỗi tạo báo cáo: ${result.error}`);
    }
  }
  console.log();
}

// Test cases
async function runTests() {
  console.log("🧪 Bắt đầu test P7 features...\n");

  // Create test data first
  await createTestData();

  // Test 1: Check export history for a date (should be empty initially)
  console.log("Test 1: Lấy lịch sử xuất ngày 2024-12-25 (ban đầu rỗng)");
  const history1 = await makeRequest("GET", "/api/reports/export/history/2024-12-25");
  console.log(`  Status: ${history1.status}`);
  console.log(`  Data: ${JSON.stringify(history1.data, null, 2)}\n`);

  // Test 2: Export manually for 2024-12-25 (should work)
  console.log("Test 2: Xuất Excel thủ công ngày 2024-12-25");
  try {
    const exportResult = await makeRequest("GET", "/api/reports/export/2024-12-25");
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
  console.log("Test 3: Lấy lịch sử xuất ngày 2024-12-25 (sau khi xuất)");
  const history2 = await makeRequest("GET", "/api/reports/export/history/2024-12-25");
  console.log(`  Status: ${history2.status}`);
  console.log(`  Số lượt xuất: ${history2.data.data?.length || 0}`);
  if (history2.data.data && history2.data.data.length > 0) {
    console.log(`  Lượt xuất gần nhất:`);
    console.log(`    - ID: ${history2.data.data[0].id}`);
    console.log(`    - Loại: ${history2.data.data[0].exportType}`);
    console.log(`    - Trạng thái: ${history2.data.data[0].status}`);
    console.log(`    - File: ${history2.data.data[0].fileName}`);
    console.log(`    - Thời gian: ${history2.data.data[0].exportedAt}`);
  }
  console.log();

  // Test 4: Try to export automatic (should fail - duplicate prevention)
  console.log("Test 4: Thử xuất tự động (automatic) ngày 2024-12-25 - phải bị chặn");
  try {
    await exportDayReport("2024-12-25", "automatic");
    console.log(`  ❌ Không được phép xuất trùng!`);
  } catch (error) {
    console.log(`  ✅ Đã chặn xuất trùng: ${error.message}`);
  }
  console.log();

  // Test 5: Export manual again (should work - manual can export multiple times)
  console.log("Test 5: Xuất thủ công lần 2 ngày 2024-12-25 (được phép)");
  try {
    const exportResult2 = await exportDayReport("2024-12-25", "manual");
    console.log(`  ✅ Xuất thành công: ${exportResult2.fileName}`);
  } catch (error) {
    console.log(`  ❌ Lỗi: ${error.message}`);
  }
  console.log();

  // Test 6: Check history (should have 2 manual exports)
  console.log("Test 6: Lấy lịch sử xuất ngày 2024-12-25 (sau 2 lần xuất manual)");
  const history3 = await makeRequest("GET", "/api/reports/export/history/2024-12-25");
  console.log(`  Status: ${history3.status}`);
  console.log(`  Số lượt xuất: ${history3.data.data?.length || 0}`);
  if (history3.data.data && history3.data.data.length > 0) {
    history3.data.data.forEach((run, index) => {
      console.log(`  Lượt ${index + 1}:`);
      console.log(`    - Loại: ${run.exportType}`);
      console.log(`    - Trạng thái: ${run.status}`);
      console.log(`    - File: ${run.fileName}`);
    });
  }
  console.log();

  // Test 7: Export automatic for different date (should work)
  console.log("Test 7: Xuất tự động ngày 2024-12-26 (ngày khác - được phép)");
  try {
    const autoExport = await exportDayReport("2024-12-26", "automatic");
    console.log(`  ✅ Xuất thành công: ${autoExport.fileName}`);
  } catch (error) {
    console.log(`  ❌ Lỗi: ${error.message}`);
  }
  console.log();

  // Test 8: Get history by date range
  console.log("Test 8: Lấy lịch sử theo khoảng ngày 2024-12-01 đến 2024-12-31");
  const historyRange = await makeRequest("GET", "/api/reports/export/history?startDate=2024-12-01&endDate=2024-12-31");
  console.log(`  Status: ${historyRange.status}`);
  console.log(`  Số lượt xuất: ${historyRange.data.data?.length || 0}`);
  if (historyRange.data.data && historyRange.data.data.length > 0) {
    console.log(`  Các ngày đã xuất:`);
    const dates = [...new Set(historyRange.data.data.map((r) => r.reportDate))];
    dates.forEach((date) => {
      const count = historyRange.data.data.filter((r) => r.reportDate === date).length;
      console.log(`    - ${date}: ${count} lần xuất`);
    });
  }
  console.log();

  // Test 9: Try automatic export again for 2024-12-26 (should fail)
  console.log("Test 9: Thử xuất tự động lần 2 ngày 2024-12-26 - phải bị chặn");
  try {
    await exportDayReport("2024-12-26", "automatic");
    console.log(`  ❌ Không được phép xuất trùng!`);
  } catch (error) {
    console.log(`  ✅ Đã chặn xuất trùng: ${error.message}`);
  }
  console.log();

  console.log("✅ Tất cả test đã hoàn tất!");
}

// Run tests
runTests().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
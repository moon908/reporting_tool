import { DataProcessingService } from "../services/DataProcessingService";
import * as assert from "assert";

function runTests() {
  console.log("Running DataProcessingService unit tests...");

  // Mock data
  const rawData = [
    { name: "Product A", revenue: "1000", cost: "600", active: "true" },
    { name: "Product B", revenue: "1500", cost: "900", active: "true" },
    { name: "Product C", revenue: "2000", cost: "1200", active: "false" },
    { name: "Product A", revenue: "1000", cost: "600", active: "true" }, // Duplicate
    { name: "Product D", revenue: "15000", cost: "5000", active: "true" }, // Outlier (Anomaly)
    { name: "Product 1", revenue: "1100", cost: "700", active: "true" },
    { name: "Product 2", revenue: "1200", cost: "800", active: "true" },
    { name: "Product 3", revenue: "1300", cost: "750", active: "true" },
    { name: "Product 4", revenue: "1400", cost: "900", active: "true" },
    { name: "Product 5", revenue: "1500", cost: "950", active: "true" },
    { name: "Product 6", revenue: "1600", cost: "1000", active: "true" },
    { name: "Product 7", revenue: "1700", cost: "1100", active: "true" },
    { name: "Product 8", revenue: "1800", cost: "1050", active: "true" },
    { name: "Product 9", revenue: "1900", cost: "1200", active: "true" },
  ];

  // 1. Test cleanData
  const cleaned = DataProcessingService.cleanData(rawData);
  console.log("Cleaned rows count:", cleaned.length);
  assert.strictEqual(cleaned.length, 13, "Duplicates should be filtered out");

  // 2. Test process
  const result = DataProcessingService.process(cleaned);
  console.log("KPIs:", result.kpis);
  console.log("Statistics keys:", Object.keys(result.statistics));
  console.log("Anomalies detected count:", result.anomalies.length);

  assert.strictEqual(result.kpis.totalRecords, 13);
  assert.strictEqual(result.anomalies.length, 2, "Should detect 2 anomalies (revenue and cost outliers for Product D)");

  // 3. Test aggregate
  const aggregation = DataProcessingService.aggregate(cleaned, "active", ["revenue"]);
  console.log("Aggregation by 'active':", aggregation);
  assert.strictEqual(aggregation.length, 2, "Should group into two active states ('true', 'false')");

  console.log("All unit tests passed successfully!");
}

runTests();

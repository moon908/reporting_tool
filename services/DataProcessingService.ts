export interface ProcessingResult {
  cleanedData: any[];
  kpis: Record<string, number>;
  statistics: Record<string, {
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    stdDev: number;
  }>;
  anomalies: Array<{
    rowIndex: number;
    column: string;
    value: number;
    mean: number;
    stdDev: number;
    zScore: number;
  }>;
  summary: string;
}

export class DataProcessingService {
  /**
   * Validates raw parsed rows against simple expected rules.
   */
  static validateData(rawData: any[]): {
    isValid: boolean;
    errors: string[];
    duplicateCount: number;
    invalidRows: number[];
  } {
    const errors: string[] = [];
    const invalidRows: number[] = [];
    let duplicateCount = 0;
    const seen = new Set<string>();

    if (!Array.isArray(rawData) || rawData.length === 0) {
      return {
        isValid: false,
        errors: ["Dataset is empty or not an array."],
        duplicateCount: 0,
        invalidRows: [],
      };
    }

    rawData.forEach((row, idx) => {
      // Simple duplicate detection by stringifying row
      const strRow = JSON.stringify(row);
      if (seen.has(strRow)) {
        duplicateCount++;
      } else {
        seen.add(strRow);
      }

      // Check if row is empty object or null
      if (!row || typeof row !== "object" || Object.keys(row).length === 0) {
        errors.push(`Row ${idx + 1} is empty or invalid.`);
        invalidRows.push(idx);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      duplicateCount,
      invalidRows,
    };
  }

  /**
   * Cleans raw data: handles missing values, normalizes formatting, and removes duplicates.
   */
  static cleanData(rawData: any[]): any[] {
    const seen = new Set<string>();
    const cleaned: any[] = [];

    for (const row of rawData) {
      if (!row || typeof row !== "object") continue;

      // 1. Remove duplicate rows
      const strRow = JSON.stringify(row);
      if (seen.has(strRow)) continue;
      seen.add(strRow);

      const cleanedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        // 2. Handle missing/null values
        if (value === null || value === undefined || value === "") {
          cleanedRow[key] = "N/A"; // String default
          continue;
        }

        // 3. Normalize formats
        if (typeof value === "string") {
          const trimmed = value.trim();

          // Try parsing number
          if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
            cleanedRow[key] = parseFloat(trimmed);
          }
          // Try parsing date
          else if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(trimmed)) {
            const date = new Date(trimmed);
            if (!isNaN(date.getTime())) {
              cleanedRow[key] = date.toISOString();
            } else {
              cleanedRow[key] = trimmed;
            }
          } else {
            cleanedRow[key] = trimmed;
          }
        } else if (typeof value === "number") {
          cleanedRow[key] = Number(value.toFixed(4).replace(/\.?0+$/, "")); // Limit precision if decimal
        } else {
          cleanedRow[key] = value;
        }
      }

      cleaned.push(cleanedRow);
    }

    return cleaned;
  }

  /**
   * Processes cleaned rows to output stats, KPIs, anomalies, and summary.
   */
  static process(cleanedData: any[]): ProcessingResult {
    if (cleanedData.length === 0) {
      return {
        cleanedData: [],
        kpis: {},
        statistics: {},
        anomalies: [],
        summary: "No data available to process.",
      };
    }

    const keys = Object.keys(cleanedData[0]);
    const numericKeys: string[] = [];

    // Find columns that are primarily numeric
    keys.forEach((key) => {
      let numericCount = 0;
      let totalCount = 0;
      cleanedData.forEach((row) => {
        const val = row[key];
        if (typeof val === "number") {
          numericCount++;
        }
        if (val !== undefined && val !== "N/A") {
          totalCount++;
        }
      });
      // If > 70% of non-missing values are numbers, treat column as numeric
      if (totalCount > 0 && numericCount / totalCount > 0.7) {
        numericKeys.push(key);
      }
    });

    // 1. Calculate Descriptive Statistics
    const statistics: ProcessingResult["statistics"] = {};
    numericKeys.forEach((key) => {
      const vals = cleanedData
        .map((r) => r[key])
        .filter((v): v is number => typeof v === "number" && !isNaN(v));

      if (vals.length === 0) return;

      const sorted = [...vals].sort((a, b) => a - b);
      const count = vals.length;
      const sum = vals.reduce((acc, curr) => acc + curr, 0);
      const mean = sum / count;
      const min = sorted[0];
      const max = sorted[count - 1];

      // Median
      const mid = Math.floor(count / 2);
      const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

      // StdDev
      const variance = vals.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0) / count;
      const stdDev = Math.sqrt(variance);

      statistics[key] = {
        count,
        sum: Number(sum.toFixed(2)),
        mean: Number(mean.toFixed(2)),
        median: Number(median.toFixed(2)),
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
        stdDev: Number(stdDev.toFixed(2)),
      };
    });

    // 2. Detect Anomalies (using standard Z-Score > 2.5)
    const anomalies: ProcessingResult["anomalies"] = [];
    numericKeys.forEach((key) => {
      const stats = statistics[key];
      if (!stats || stats.stdDev === 0) return;

      cleanedData.forEach((row, idx) => {
        const val = row[key];
        if (typeof val !== "number") return;

        const zScore = Math.abs(val - stats.mean) / stats.stdDev;
        if (zScore > 2.5) {
          anomalies.push({
            rowIndex: idx,
            column: key,
            value: val,
            mean: stats.mean,
            stdDev: stats.stdDev,
            zScore: Number(zScore.toFixed(2)),
          });
        }
      });
    });

    // 3. Calculate KPIs
    const kpis: Record<string, number> = {
      totalRecords: cleanedData.length,
      numericColumnsCount: numericKeys.length,
      anomalyCount: anomalies.length,
    };

    // Extract business-focused KPIs if key names match common financial / operational tags
    let totalRevenue = 0;
    let totalCost = 0;
    let revenueKey = "";
    let costKey = "";

    numericKeys.forEach((key) => {
      const lowKey = key.toLowerCase();
      if (lowKey.includes("revenue") || lowKey.includes("sales") || lowKey.includes("turnover")) {
        revenueKey = key;
        totalRevenue = statistics[key]?.sum || 0;
      }
      if (lowKey.includes("cost") || lowKey.includes("expense") || lowKey.includes("spend")) {
        costKey = key;
        totalCost = statistics[key]?.sum || 0;
      }
    });

    if (revenueKey) {
      kpis["totalRevenue"] = totalRevenue;
    }
    if (costKey) {
      kpis["totalCost"] = totalCost;
    }
    if (revenueKey && costKey) {
      const margin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
      kpis["netProfit"] = Number((totalRevenue - totalCost).toFixed(2));
      kpis["profitMarginPercentage"] = Number(margin.toFixed(2));
    }

    // 4. Generate Summarized textual statement
    let summary = `Dataset contains ${cleanedData.length} records across ${keys.length} columns. `;
    if (numericKeys.length > 0) {
      summary += `Analyzed ${numericKeys.length} numeric metrics: ${numericKeys.join(", ")}. `;
      const primaryMetric = numericKeys[0];
      const stats = statistics[primaryMetric];
      if (stats) {
        summary += `For ${primaryMetric}, the average is ${stats.mean} with values ranging from ${stats.min} to ${stats.max}. `;
      }
    }
    if (anomalies.length > 0) {
      summary += `Detected ${anomalies.length} anomalous value deviations in the dataset.`;
    } else {
      summary += `No major anomalies were detected in the dataset.`;
    }

    return {
      cleanedData,
      kpis,
      statistics,
      anomalies,
      summary,
    };
  }

  /**
   * Groups rows by a specific categorical field, calculating sum and average for numeric fields.
   */
  static aggregate(rows: any[], groupByField: string, numericFields: string[]) {
    const groups: Record<string, Record<string, any>> = {};

    rows.forEach((row) => {
      const groupVal = String(row[groupByField] ?? "N/A");
      if (!groups[groupVal]) {
        groups[groupVal] = {
          group: groupVal,
          count: 0,
        };
        numericFields.forEach((field) => {
          groups[groupVal][`${field}_sum`] = 0;
          groups[groupVal][`${field}_count`] = 0;
        });
      }

      groups[groupVal].count += 1;
      numericFields.forEach((field) => {
        const val = row[field];
        if (typeof val === "number" && !isNaN(val)) {
          groups[groupVal][`${field}_sum`] += val;
          groups[groupVal][`${field}_count`] += 1;
        }
      });
    });

    // Compute averages
    return Object.values(groups).map((group) => {
      const result: any = { ...group };
      numericFields.forEach((field) => {
        const sum = result[`${field}_sum`];
        const count = result[`${field}_count`];
        result[`${field}_avg`] = count > 0 ? Number((sum / count).toFixed(2)) : 0;
        result[`${field}_sum`] = Number(sum.toFixed(2));
        delete result[`${field}_count`]; // clean up temporary counts
      });
      return result;
    });
  }
}

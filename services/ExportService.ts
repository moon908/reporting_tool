import { Workbook } from "exceljs";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export class ExportService {
  /**
   * Generates a CSV string.
   */
  static exportToCSV(headers: string[], data: any[]): string {
    const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
    const rows = data.map((row) => {
      return headers
        .map((h) => {
          const val = row[h] !== undefined ? String(row[h]) : "";
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",");
    });
    return [headerLine, ...rows].join("\n");
  }

  /**
   * Generates an Excel Workbook buffer.
   */
  static async exportToExcel(
    title: string,
    headers: string[],
    data: any[],
    kpis: Record<string, number> = {}
  ): Promise<Buffer> {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet("Report Data");

    // Title Styling
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = title;
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF3B82F6" }, // Accent blue
    };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.getRow(1).height = 40;

    // KPI Section
    let currRow = 3;
    const kpiEntries = Object.entries(kpis);
    if (kpiEntries.length > 0) {
      sheet.getCell(`A${currRow}`).value = "Key Performance Indicators (KPIs)";
      sheet.getCell(`A${currRow}`).font = { name: "Arial", size: 12, bold: true };
      currRow++;

      // Write KPIs in key-value format
      kpiEntries.forEach(([key, val]) => {
        sheet.getCell(`A${currRow}`).value = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        sheet.getCell(`B${currRow}`).value = val;
        sheet.getCell(`A${currRow}`).font = { name: "Arial", bold: true };
        sheet.getCell(`B${currRow}`).alignment = { horizontal: "left" };
        currRow++;
      });
      currRow += 2;
    }

    // Table Header
    sheet.getCell(`A${currRow}`).value = "Cleaned Dataset Record List";
    sheet.getCell(`A${currRow}`).font = { name: "Arial", size: 12, bold: true };
    currRow++;

    const headerRowIdx = currRow;
    headers.forEach((h, colIdx) => {
      const cell = sheet.getCell(headerRowIdx, colIdx + 1);
      cell.value = h;
      cell.font = { name: "Arial", bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF475569" }, // Slate-600
      };
      cell.alignment = { horizontal: "center" };
    });
    sheet.getRow(headerRowIdx).height = 24;
    currRow++;

    // Data Rows
    data.forEach((row) => {
      headers.forEach((h, colIdx) => {
        const cell = sheet.getCell(currRow, colIdx + 1);
        const val = row[h];
        cell.value = val !== undefined ? val : "";
        cell.font = { name: "Arial", size: 10 };
      });
      currRow++;
    });

    // Auto-fit columns
    sheet.columns.forEach((col) => {
      let maxLen = 0;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.max(maxLen + 3, 12);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Generates a beautifully styled PDF document as a Uint8Array buffer.
   */
  static async exportToPDF(params: {
    title: string;
    orgName: string;
    brandColor?: string;
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    headers: string[];
    data: any[];
    kpis?: Record<string, number>;
  }): Promise<Uint8Array> {
    // Initialize jsPDF (portrait mode, pt units, a4 format)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const brandColor = params.brandColor || "#3b82f6"; // Tailwind blue by default
    const r = parseInt(brandColor.slice(1, 3), 16) || 59;
    const g = parseInt(brandColor.slice(3, 5), 16) || 130;
    const b = parseInt(brandColor.slice(5, 7), 16) || 246;

    let y = 40;

    // Header bar (Brand color)
    doc.setFillColor(r, g, b);
    doc.rect(40, y, 515, 60, "F");

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(params.title.toUpperCase(), 60, y + 36);

    // Organization Logo / Text
    doc.setFontSize(10);
    doc.text(params.orgName, 460, y + 34);
    y += 85;

    // Report Meta Box
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(40, y, 515, 45, "F");
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 55, y + 25);
    doc.text(`Format: PDF Enterprise Report`, 380, y + 25);
    y += 65;

    // Executive Summary Section
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("1. Executive Summary", 40, y);
    y += 15;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitSummary = doc.splitTextToSize(params.summary, 515);
    doc.text(splitSummary, 40, y);
    y += splitSummary.length * 12 + 25;

    // KPIs Grid
    if (params.kpis && Object.keys(params.kpis).length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("2. Key Metrics & KPIs", 40, y);
      y += 15;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let count = 0;
      Object.entries(params.kpis).forEach(([k, val]) => {
        const displayKey = k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        const text = `${displayKey}: ${typeof val === "number" ? val.toLocaleString() : val}`;
        
        // Draw in two columns
        const colX = count % 2 === 0 ? 40 : 280;
        doc.text(text, colX, y);
        if (count % 2 !== 0) y += 15;
        count++;
      });
      if (count % 2 !== 0) y += 15;
      y += 20;
    }

    // Key Findings & Recommendations
    if (params.keyFindings.length > 0 || params.recommendations.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("3. AI-Powered Findings & Recommendations", 40, y);
      y += 18;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Key Findings:", 40, y);
      y += 12;

      doc.setFont("helvetica", "normal");
      params.keyFindings.forEach((finding) => {
        const splitFinding = doc.splitTextToSize(`• ${finding}`, 515);
        doc.text(splitFinding, 45, y);
        y += splitFinding.length * 12 + 4;
      });

      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Recommendations:", 40, y);
      y += 12;

      doc.setFont("helvetica", "normal");
      params.recommendations.forEach((rec) => {
        const splitRec = doc.splitTextToSize(`• ${rec}`, 515);
        doc.text(splitRec, 45, y);
        y += splitRec.length * 12 + 4;
      });

      y += 25;
    }

    // Add Page Break for Table if space is tight
    if (y > 600) {
      doc.addPage();
      y = 40;
    }

    // Cleaned Table Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("4. Processed Data Table", 40, y);

    // jspdf-autotable integration
    const tableBody = params.data.map((row) => params.headers.map((h) => row[h] !== undefined ? String(row[h]) : ""));
    
    autoTable(doc, {
      head: [params.headers],
      body: tableBody,
      startY: y + 10,
      margin: { left: 40, right: 40 },
      styles: {
        fontSize: 8,
        cellPadding: 4,
      },
      headStyles: {
        fillColor: [r, g, b],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // slate-50
      },
    });

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(40, 800, 555, 800);
      
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFontSize(8);
      doc.text("CONFIDENTIAL - FOR INTERNAL USE ONLY", 40, 815);
      doc.text(`Page ${i} of ${totalPages}`, 500, 815);
    }

    return new Uint8Array(doc.output("arraybuffer"));
  }
}

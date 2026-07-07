"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportService } from "@/services/ExportService";
import { motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ReportViewProps {
  report: {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
    organization: { name: string; brandColor: string | null } | null;
    createdBy: { name: string | null; email: string };
    charts: Array<{ id: string; type: string; title: string; config: string; data: string }>;
    dataset: {
      id: string;
      name: string;
      processedData: {
        cleanedData: string;
        kpis: string;
        statistics: string;
        anomalies: string;
        insights: {
          executiveSummary: string;
          keyFindings: string;
          recommendations: string;
          trendAnalysis: string;
          riskAnalysis: string;
          forecast: string;
          businessInsights: string;
        } | null;
      } | null;
    } | null;
  };
}

export default function ReportView({ report }: ReportViewProps) {
  const [downloading, setDownloading] = useState(false);
  const dataset = report.dataset;
  const processedData = dataset?.processedData;
  const insights = processedData?.insights;

  const cleanedRows = processedData?.cleanedData ? JSON.parse(processedData.cleanedData) : [];
  const kpis = processedData?.kpis ? JSON.parse(processedData.kpis) : {};
  const stats = processedData?.statistics ? JSON.parse(processedData.statistics) : {};
  const anomalies = processedData?.anomalies ? JSON.parse(processedData.anomalies) : [];

  const keyFindings = insights?.keyFindings ? JSON.parse(insights.keyFindings) : [];
  const recommendations = insights?.recommendations ? JSON.parse(insights.recommendations) : [];

  const headers = cleanedRows.length > 0 ? Object.keys(cleanedRows[0]) : [];

  const handleExportPDF = async () => {
    setDownloading(true);
    try {
      const pdfBytes = await ExportService.exportToPDF({
        title: report.title,
        orgName: report.organization?.name || "Spectra Reports",
        brandColor: report.organization?.brandColor || "#6366f1",
        summary: insights?.executiveSummary || "N/A",
        keyFindings,
        recommendations,
        headers,
        data: cleanedRows,
        kpis,
      });

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.toLowerCase().replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
    setDownloading(false);
  };

  const handleExportExcel = async () => {
    setDownloading(true);
    try {
      const excelBytes = await ExportService.exportToExcel(
        report.title,
        headers,
        cleanedRows,
        kpis
      );

      const blob = new Blob([excelBytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.toLowerCase().replace(/\s+/g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel generation failed:", err);
    }
    setDownloading(false);
  };

  const handleExportCSV = () => {
    try {
      const csvStr = ExportService.exportToCSV(headers, cleanedRows);
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.toLowerCase().replace(/\s+/g, "_")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("CSV generation failed:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{report.title}</h2>
          <p className="text-xs text-muted-foreground">
            Processed on {new Date(report.createdAt).toLocaleDateString()} by {report.createdBy?.name || "System"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={downloading} className="text-xs font-semibold">
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={downloading} className="text-xs font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </Button>
          <Button size="sm" onClick={handleExportPDF} disabled={downloading} className="text-xs font-semibold flex items-center gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="insights" className="text-xs">AI Insights Summary</TabsTrigger>
          <TabsTrigger value="visuals" className="text-xs">Charts & Plots</TabsTrigger>
          <TabsTrigger value="table" className="text-xs">Processed Cells Table</TabsTrigger>
        </TabsList>

        {/* Tab 1: AI Insights */}
        <TabsContent value="insights" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col - Summary */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass-card border-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Executive Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insights?.executiveSummary || "No AI insights generated for this report."}
                  </p>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Findings */}
                <Card className="glass-card border-border/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold tracking-tight">Core Business Findings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {keyFindings.map((finding: string, idx: number) => (
                        <li key={idx} className="text-xs flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span className="text-muted-foreground leading-relaxed">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="glass-card border-border/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold tracking-tight">Strategic Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-xs flex items-start gap-2">
                          <span className="text-primary font-bold">•</span>
                          <span className="text-muted-foreground leading-relaxed">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Col - Stats & KPIs */}
            <div className="space-y-6">
              <Card className="glass-card border-border/40 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    Key Performance Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(kpis).map(([k, val]: [string, any]) => {
                    const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
                    return (
                      <div key={k} className="flex justify-between items-center border-b border-border/20 pb-2">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-bold text-foreground">
                          {typeof val === "number" ? val.toLocaleString() : val}
                        </span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {anomalies.length > 0 && (
                <Card className="glass-card border-destructive/20 shadow-sm bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold tracking-tight text-destructive">
                      Anomalous Outliers Detected ({anomalies.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {anomalies.map((anom: any, idx: number) => (
                        <div key={idx} className="text-[10px] text-muted-foreground border-b border-border/10 pb-1">
                          Row <span className="font-semibold text-foreground">#{anom.rowIndex + 1}</span>:{" "}
                          <span className="text-destructive font-semibold">{anom.column}</span> is{" "}
                          <span className="font-bold text-foreground">{anom.value}</span> (Z-score: {anom.zScore})
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Visuals Charts */}
        <TabsContent value="visuals" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.charts.map((chart) => {
              const chartData = JSON.parse(chart.data);
              const config = JSON.parse(chart.config);

              return (
                <Card key={chart.id} className="glass-card border-border/40 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold tracking-tight">{chart.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {chart.type === "BAR" ? (
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey={config.xKey} fontSize={8} stroke="#94a3b8" />
                          <YAxis fontSize={8} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ background: "#0f172a", border: "none", color: "#fff" }} />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                          <Bar dataKey={config.yKey} name={config.yKey} fill={config.color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey={config.xKey} fontSize={8} stroke="#94a3b8" />
                          <YAxis fontSize={8} stroke="#94a3b8" />
                          <Tooltip contentStyle={{ background: "#0f172a", border: "none", color: "#fff" }} />
                          <Legend wrapperStyle={{ fontSize: "10px" }} />
                          <Line type="monotone" dataKey={config.yKey1} name={config.yKey1} stroke={config.color1} strokeWidth={2} />
                          {config.yKey2 && (
                            <Line type="monotone" dataKey={config.yKey2} name={config.yKey2} stroke={config.color2} strokeWidth={2} />
                          )}
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 3: Detailed Table Cells */}
        <TabsContent value="table" className="pt-4">
          <Card className="glass-card border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold tracking-tight">Ingested Table Dataset</CardTitle>
              <CardDescription className="text-xs">Cleaned and normalized records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider sticky top-0">
                      {headers.map((h) => (
                        <th key={h} className="p-3">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cleanedRows.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/50">
                        {headers.map((h) => (
                          <td key={h} className="p-3 text-muted-foreground truncate max-w-[150px]">
                            {row[h] !== undefined ? String(row[h]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

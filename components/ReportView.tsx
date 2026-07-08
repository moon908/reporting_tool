"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportService } from "@/services/ExportService";
import { chatWithAIAboutReportAction } from "@/actions/reportActions";
import { motion } from "framer-motion";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Sparkles,
  TrendingUp,
  Send,
  Bot,
  User,
  MessageSquare,
  Loader2,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
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
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hello! I am your AI analyst. Ask me any questions about the "${report.title}" report, such as key findings, potential risks, trends, or anomalous outliers.`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = { role: "user" as const, content: chatInput.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const result = await chatWithAIAboutReportAction(report.id, newMessages);
      if (result.success && result.answer) {
        setMessages([...newMessages, { role: "assistant", content: result.answer }]);
      } else {
        setMessages([
          ...newMessages,
          { role: "assistant", content: `Sorry, I encountered an issue: ${result.error || "Unknown error"}` },
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Failed to communicate with AI analyst. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

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

              {/* AI Conversation Block */}
              <Card className="glass-card border-border/40 shadow-sm flex flex-col h-[400px]">
                <CardHeader className="pb-3 border-b border-border/20 flex flex-row items-center gap-2 space-y-0 py-4">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <div>
                    <CardTitle className="text-sm font-semibold tracking-tight">AI Data Chat</CardTitle>
                    <CardDescription className="text-[10px]">Ask questions about this report</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  {/* Message Container */}
                  <div
                    ref={chatScrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin text-xs"
                  >
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2.5 max-w-[85%] ${
                          msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === "user"
                              ? "bg-primary/20 text-primary"
                              : "bg-slate-800 text-slate-300 border border-border/30"
                          }`}
                        >
                          {msg.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                        </div>
                        <div
                          className={`p-2.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-slate-900/60 text-muted-foreground border border-border/20 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}

                    {chatLoading && (
                      <div className="flex gap-2.5 max-w-[85%]">
                        <div className="h-6 w-6 rounded-full bg-slate-800 text-slate-300 border border-border/30 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3 w-3 animate-pulse" />
                        </div>
                        <div className="p-2.5 bg-slate-900/60 border border-border/20 rounded-2xl rounded-tl-none flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span className="text-[10px] animate-pulse">Analyzing report data...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={handleSendChatMessage}
                    className="p-3 border-t border-border/20 bg-slate-900/30 flex gap-2 items-center"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me something about the data..."
                      disabled={chatLoading}
                      className="flex-1 bg-slate-950/40 border border-border/30 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/60 disabled:opacity-50"
                    />
                    <Button
                      type="submit"
                      disabled={!chatInput.trim() || chatLoading}
                      size="icon"
                      className="h-8 w-8 rounded-lg flex-shrink-0 bg-primary hover:bg-primary/95 text-primary-foreground"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
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

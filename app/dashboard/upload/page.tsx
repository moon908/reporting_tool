"use client";

import { uploadAndProcessFileAction } from "@/actions/reportActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { AlertCircle, CheckCircle2, FileSpreadsheet, Sparkles, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";

export default function IngestionPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["csv", "json", "xml", "xlsx", "xls"];

    if (!ext || !validExtensions.includes(ext)) {
      setStatus("error");
      setErrorMessage("Unsupported file type. Please upload a CSV, Excel, JSON, or XML file.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setStatus("idle");
    setErrorMessage(null);
    setValidationErrors([]);
    setUploadProgress(0);

    // Read simple text preview for client inspection (first few rows)
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (ext === "csv") {
        const lines = text.split(/\r?\n/).slice(0, 6);
        if (lines.length > 0) {
          const headers = lines[0].split(",").map((h: string) => h.trim());
          const rows = lines.slice(1).map((line: string) => {
            const cells = line.split(",");
            const row: any = {};
            headers.forEach((h: string, idx: number) => {
              row[h] = cells[idx] || "";
            });
            return row;
          });
          setPreviewHeaders(headers);
          setPreviewRows(rows.filter((r: any) => Object.values(r).some(v => v !== "")));
        }
      } else if (ext === "json") {
        try {
          const parsed = JSON.parse(text);
          const items = Array.isArray(parsed) ? parsed.slice(0, 5) : [parsed];
          if (items.length > 0) {
            setPreviewHeaders(Object.keys(items[0]));
            setPreviewRows(items);
          }
        } catch {}
      }
    };

    if (ext === "csv" || ext === "json" || ext === "xml") {
      reader.readAsText(selectedFile.slice(0, 10240)); // read first 10kb
    } else {
      setPreviewHeaders(["Excel File Sheet Data Preview"]);
      setPreviewRows([{ "Notice": "Previews are not available for binary Excel spreadsheets, but full parsing will execute on the server." }]);
    }
  };

  const triggerUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    setUploadProgress(10);

    const reader = new FileReader();
    reader.onload = async (e) => {
      setUploadProgress(50);
      const binary = e.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(binary);
      let binaryString = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binaryString);

      setUploadProgress(90);
      setStatus("processing");

      try {
        const result = await uploadAndProcessFileAction({
          fileName: file.name,
          fileContentBase64: base64,
          fileSize: file.size,
        });

        if (result.success) {
          setUploadProgress(100);
          setStatus("success");
          setTimeout(() => {
            router.push(`/dashboard/reports/${result.reportId}`);
          }, 1500);
        } else {
          setStatus("error");
          setErrorMessage(result.error || "Ingestion pipeline encountered a cleaning or formatting error.");
          if (result.validationErrors) {
            setValidationErrors(result.validationErrors);
          }
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Network transfer or parsing failed.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Ingest Data Table</h2>
        <p className="text-xs text-muted-foreground">
          Upload CSV, Excel, XML, or JSON tables. The pipeline executes cleaning, anomalies checks, and creates AI reports.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Box Card */}
        <Card className="lg:col-span-2 glass-card border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">Upload Dataset</CardTitle>
            <CardDescription className="text-xs">Drag and drop or click to browse</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[220px]",
                dragActive
                  ? "border-primary bg-primary/5 scale-[0.99]"
                  : "border-border hover:border-primary/50 hover:bg-slate-500/5"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.json,.xml,.xlsx,.xls"
                onChange={handleFileChange}
              />
              <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-4 text-muted-foreground">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {file ? file.name : "Select a dataset file"}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-xs">
                Supports CSV, Excel (.xlsx, .xls), JSON arrays, and simple row XML schemas up to 10MB.
              </p>
            </div>

            {/* Ingestion progress */}
            {status !== "idle" && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="capitalize">{status === "processing" ? "Analyzing with AI..." : `${status}...`}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {/* Buttons */}
            {file && status === "idle" && (
              <Button onClick={triggerUpload} className="w-full flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4" /> Start Ingestion Pipeline
              </Button>
            )}

            {/* Success Alert */}
            {status === "success" && (
              <div className="bg-emerald-500/10 text-emerald-500 text-xs p-3 rounded-lg border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Ingestion succeeded! Opening your AI report summary...</span>
              </div>
            )}

            {/* Error Alert */}
            {status === "error" && (
              <div className="space-y-3">
                <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20 flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>

                {validationErrors.length > 0 && (
                  <div className="border border-destructive/25 rounded-lg p-3 bg-destructive/5 text-[11px] space-y-1">
                    <p className="font-semibold text-destructive">Data Schema Errors Details:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground max-h-36 overflow-y-auto">
                      {validationErrors.map((err: string, idx: number) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Panel Card */}
        <Card className="glass-card border-border/40 shadow-sm h-full">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">Dataset Table Preview</CardTitle>
            <CardDescription className="text-xs">First few raw records of selected table</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] overflow-auto">
            {previewRows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-xs text-muted-foreground space-y-2">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground/50" />
                <p>Select a file to inspect its parsed header structure and cells preview.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="min-w-full text-[10px] text-left">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground font-semibold bg-muted/30">
                      {previewHeaders.map((header: string) => (
                        <th key={header} className="p-1 px-2 uppercase truncate max-w-[100px]">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/20">
                        {previewHeaders.map((header: string) => (
                          <td key={header} className="p-1.5 px-2 truncate max-w-[100px] text-muted-foreground">
                            {row[header] !== undefined ? String(row[header]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

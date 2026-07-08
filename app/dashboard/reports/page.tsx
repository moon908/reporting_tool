import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function ReportsListPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const orgId = session.user.organizationId;
  let reports: any[] = [];
  let isDemo = false;

  try {
    // Query all reports for the organization
    reports = await db.report.findMany({
      where: { organizationId: orgId },
      include: {
        createdBy: { select: { name: true, email: true } },
        dataset: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    isDemo = true;
    reports = [
      {
        id: "demo-1",
        title: "Sales Q2 Progress Summary",
        description: "Automated business performance analysis (Simulation Mode)",
        format: "PDF",
        createdAt: new Date(),
        createdBy: { name: "Spectra Admin", email: "admin@spectra.com" },
        dataset: { name: "Mock Sales Performance Data" },
      },
      {
        id: "demo-2",
        title: "Marketing Campaign Conversion Statistics",
        description: "Ad spend and conversion funnel metrics (Simulation Mode)",
        format: "PDF",
        createdAt: new Date(Date.now() - 86400000),
        createdBy: { name: "Spectra Admin", email: "admin@spectra.com" },
        dataset: { name: "Conversion Data" },
      },
    ];
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Generated Reports</h2>
          <p className="text-xs text-muted-foreground">
            List of generated PDF analytics documents from uploaded datasets.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
              Demo Database
            </span>
          )}
          <Link href="/dashboard/upload">
            <Button className="flex items-center gap-2 text-xs font-semibold">
              <Plus className="h-4 w-4" /> Generate Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Reports Grid */}
      {reports.length === 0 ? (
        <Card className="glass-card border-border/40 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-muted-foreground/60">
            <FileText className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">No reports available</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Upload a dataset to automatically validate, clean, analyze, and generate your first report summary.
            </p>
          </div>
          <Link href="/dashboard/upload">
            <Button size="sm">Upload Dataset</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report: any) => (
            <Card
              key={report.id}
              className="glass-card border-border/40 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                    {report.format}
                  </span>
                </div>
                <CardTitle className="text-sm font-semibold tracking-tight mt-4 truncate">
                  {report.title}
                </CardTitle>
                <CardDescription className="text-[11px] truncate">
                  {report.dataset?.name ? `Dataset: ${report.dataset.name}` : "Manual Analysis"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {report.description || "Automated report processed by the data engine."}
                </p>
                <div className="pt-2 border-t border-border/20 flex justify-between items-center text-[10px] text-muted-foreground">
                  <span>By: {report.createdBy?.name || "System"}</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href={report.id.startsWith("demo") ? `/dashboard/reports/${report.id}` : `/dashboard/reports/${report.id}`} className="w-full">
                  <Button variant="outline" className="w-full text-xs font-semibold">
                    Open Summary & Export
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

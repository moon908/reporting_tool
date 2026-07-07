import { auth } from "@/auth";
import { getReportDetailsAction } from "@/actions/reportActions";
import ReportView from "@/components/ReportView";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { FileWarning } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ReportDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReportDetailsPage({ params }: ReportDetailsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const { id } = await params;
  let report: any = null;

  if (id.startsWith("demo")) {
    // Generate beautiful demo report parameters
    report = {
      id: "demo-report-id",
      title: "Sales Q2 Progress Summary",
      description: "Automated business performance analysis (Simulation Mode)",
      createdAt: new Date(),
      createdBy: { name: "Acme Admin", email: "admin@acme.com" },
      charts: [
        {
          id: "chart-1",
          type: "BAR",
          title: "Distribution of revenue",
          config: JSON.stringify({ xKey: "label", yKey: "value1", color: "#3b82f6" }),
          data: JSON.stringify([
            { label: "Product A", value1: 1000 },
            { label: "Product B", value1: 1500 },
            { label: "Product C", value1: 2000 },
            { label: "Product D", value1: 15000 },
            { label: "Product E", value1: 1100 },
            { label: "Product F", value1: 1200 },
          ]),
        },
      ],
      dataset: {
        id: "ds-demo",
        name: "Mock Sales Performance Data",
        processedData: {
          cleanedData: JSON.stringify([
            { name: "Product A", revenue: 1000, cost: 600, active: "true" },
            { name: "Product B", revenue: 1500, cost: 900, active: "true" },
            { name: "Product C", revenue: 2000, cost: 1200, active: "false" },
            { name: "Product D", revenue: 15000, cost: 5000, active: "true" },
            { name: "Product E", revenue: 1100, cost: 700, active: "true" },
            { name: "Product F", revenue: 1200, cost: 800, active: "true" },
          ]),
          kpis: JSON.stringify({
            totalRecords: 6,
            numericColumnsCount: 2,
            anomalyCount: 2,
            totalRevenue: 22800,
            totalCost: 9200,
            netProfit: 13600,
            profitMarginPercentage: 59.65,
          }),
          statistics: JSON.stringify({
            revenue: { count: 6, sum: 22800, mean: 3800, median: 1350, min: 1000, max: 15000, stdDev: 5013.98 },
            cost: { count: 6, sum: 9200, mean: 1533.33, median: 850, min: 600, max: 5000, stdDev: 1563.47 },
          }),
          anomalies: JSON.stringify([
            { rowIndex: 3, column: "revenue", value: 15000, mean: 3800, stdDev: 5013.98, zScore: 2.23 },
            { rowIndex: 3, column: "cost", value: 5000, mean: 1533.33, stdDev: 1563.47, zScore: 2.22 },
          ]),
          insights: {
            executiveSummary: "Demo Mode: Revenue streams are highly robust. Outliers detected in cost configurations reflect the major Q2 Product D sale and delivery costs. Net profit margin is excellent at 59.65%.",
            keyFindings: JSON.stringify([
              "Product D represents a substantial outlier with $15,000 in revenue.",
              "Net profit yields $13,600 across core products lines.",
              "Operating cost allocations align perfectly with revenue growth scaling.",
            ]),
            recommendations: JSON.stringify([
              "Review distribution costs associated with high-value outlier items.",
              "Optimize low-margin operations for Products A and E.",
              "Expand regional marketing strategies for high-margin Product C profiles.",
            ]),
            trendAnalysis: "Linear revenue tracking.",
            riskAnalysis: "Anomaly outlier cost profiles.",
            forecast: "Positive trend indicators.",
            businessInsights: "Core sales perform efficiently.",
          },
        },
      },
    };
  } else {
    try {
      report = await getReportDetailsAction(id);
    } catch (err) {
      console.error("Failed to query report details from DB:", err);
    }
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full glass-card border-border/40 p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <FileWarning className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Report Not Found</h3>
            <p className="text-xs text-muted-foreground">
              The report you are trying to view does not exist or has been removed.
            </p>
          </div>
          <Link href="/dashboard/reports">
            <Button size="sm">Back to Reports</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const castedReport: any = {
    ...report,
    organization: {
      name: "Acme Analytics",
      brandColor: "#3b82f6",
    },
  };

  return <ReportView report={castedReport} />;
}

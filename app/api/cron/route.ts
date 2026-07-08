import { db } from "@/lib/db";
import { AIService } from "@/services/AIService";
import { DataProcessingService } from "@/services/DataProcessingService";
import { EmailService } from "@/services/EmailService";
import { ExportService } from "@/services/ExportService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // 1. Verify cron authorization token
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const now = new Date();

    // 2. Fetch active schedules that need to run
    const schedules = await db.scheduledReport.findMany({
      where: {
        isActive: true,
        OR: [
          { nextRun: null },
          { nextRun: { lte: now } },
        ],
      },
      include: {
        organization: true,
      },
    });

    console.log(`Cron execution started at ${now.toISOString()}. Found ${schedules.length} schedules to process.`);

    const results = [];

    for (const schedule of schedules) {
      try {
        // Fetch the latest dataset for the organization
        const latestDataset = await db.dataset.findFirst({
          where: {
            upload: {
              organizationId: schedule.organizationId,
            },
          },
          orderBy: { createdAt: "desc" },
          include: {
            upload: true,
          },
        });

        if (!latestDataset) {
          console.warn(`No dataset found for organization ${schedule.organizationId}. Skipping schedule ${schedule.id}.`);
          continue;
        }

        // Run data cleaning and process metrics
        const rawRows = JSON.parse(latestDataset.rawData);
        const cleanedRows = DataProcessingService.cleanData(rawRows);
        const processResult = DataProcessingService.process(cleanedRows);

        // Generate AI insights (or use mock fallback)
        const sampleRows = cleanedRows.slice(0, 3);
        const aiInsights = await AIService.generateInsights({
          datasetName: latestDataset.name,
          kpis: processResult.kpis,
          statistics: processResult.statistics,
          anomaliesCount: processResult.anomalies.length,
          sampleRows,
        });

        // Determine output headers from cleaned data keys
        const headers = cleanedRows.length > 0 ? Object.keys(cleanedRows[0]) : [];

        // Generate PDF report
        const pdfContent = await ExportService.exportToPDF({
          title: schedule.name,
          orgName: schedule.organization.name,
          brandColor: schedule.organization.brandColor || "#3b82f6",
          summary: aiInsights.executiveSummary,
          keyFindings: aiInsights.keyFindings,
          recommendations: aiInsights.recommendations,
          headers,
          data: cleanedRows,
          kpis: processResult.kpis,
        });

        // Store generated report record in the database
        const report = await db.report.create({
          data: {
            title: schedule.name,
            description: `Automated scheduled report run (${schedule.frequency})`,
            format: "PDF",
            status: "COMPLETED",
            createdById: schedule.createdById,
            organizationId: schedule.organizationId,
            datasetId: latestDataset.id,
          },
        });

        // Parse recipients list
        const recipientsList = schedule.recipients
          .split(",")
          .map((r: string) => r.trim())
          .filter((r: string) => r.length > 0);

        // Send Email
        const emailSent = await EmailService.sendReportEmail({
          to: recipientsList,
          subject: `Automated Report: ${schedule.name}`,
          message: `Please find attached your scheduled report "${schedule.name}" generated on ${now.toLocaleDateString()}.\n\nExecutive Summary:\n${aiInsights.executiveSummary}`,
          attachmentFilename: `${schedule.name.toLowerCase().replace(/\s+/g, "_")}_${now.getTime()}.pdf`,
          attachmentContent: Buffer.from(pdfContent),
        });

        // Create notification for creator
        await db.notification.create({
          data: {
            title: "Scheduled Report Completed",
            message: `Scheduled report "${schedule.name}" has been generated and emailed to ${recipientsList.length} recipient(s).`,
            type: "SUCCESS",
            userId: schedule.createdById,
          },
        });

        // Log Activity
        await db.activityLog.create({
          data: {
            action: "REPORT_GENERATION",
            details: JSON.stringify({
              scheduleId: schedule.id,
              reportId: report.id,
              recipients: recipientsList,
              emailSent,
            }),
            userId: schedule.createdById,
            organizationId: schedule.organizationId,
          },
        });

        // Update schedule metrics (calculate next run date)
        const nextRun = calculateNextRun(now, schedule.frequency);
        await db.scheduledReport.update({
          where: { id: schedule.id },
          data: {
            lastRun: now,
            nextRun,
          },
        });

        results.push({ scheduleId: schedule.id, status: "SUCCESS", reportId: report.id });
      } catch (err: any) {
        console.error(`Failed to process schedule ${schedule.id}:`, err);
        results.push({ scheduleId: schedule.id, status: "FAILED", error: err.message });

        // Update schedule nextRun to prevent infinite retry loops on failure
        const nextRun = calculateNextRun(now, schedule.frequency);
        await db.scheduledReport.update({
          where: { id: schedule.id },
          data: {
            nextRun,
          },
        }).catch((dbErr: any) => console.error("Failed to update schedule fail-safe nextRun:", dbErr));

        // Create failure notification
        await db.notification.create({
          data: {
            title: "Scheduled Report Failed",
            message: `Scheduled report "${schedule.name}" failed: ${err.message}`,
            type: "ERROR",
            userId: schedule.createdById,
          },
        }).catch((dbErr: any) => console.error("Failed to create error notification:", dbErr));
      }
    }

    return NextResponse.json({ status: "completed", processed: results.length, details: results });
  } catch (error: any) {
    console.error("Cron handler global error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateNextRun(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency.toUpperCase()) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return next;
}

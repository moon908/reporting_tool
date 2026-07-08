import { auth } from "@/auth";
import ScheduleForm from "@/components/ScheduleForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { Calendar, Mail, Play } from "lucide-react";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function SchedulesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const orgId = session.user.organizationId;
  let schedules: any[] = [];
  let isDemo = false;

  try {
    // Retrieve current active schedules
    schedules = await db.scheduledReport.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    isDemo = true;
    schedules = [
      {
        id: "demo-sched-1",
        name: "Weekly Sales Summary",
        frequency: "WEEKLY",
        recipients: "team@acme.com, boss@acme.com",
        lastRun: new Date(Date.now() - 3 * 86400000),
        nextRun: new Date(Date.now() + 4 * 86400000),
      },
      {
        id: "demo-sched-2",
        name: "Daily Ingestion Alerts",
        frequency: "DAILY",
        recipients: "alerts@acme.com",
        lastRun: new Date(Date.now() - 12 * 3600000),
        nextRun: new Date(Date.now() + 12 * 3600000),
      },
    ];
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Scheduled Analytics Reports</h2>
          <p className="text-xs text-muted-foreground">
            Establish automatic data checks and schedule automated email deliveries of compiled PDF summaries.
          </p>
        </div>
        {isDemo && (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
            Demo Database
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Form Column */}
        <div className="lg:col-span-1">
          <ScheduleForm />
        </div>

        {/* Schedules list Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card border-border/40 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">Active Automation Schedules</CardTitle>
              <CardDescription className="text-xs">Recurring report generators and delivery states</CardDescription>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center space-y-2">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                  <p>No automation schedules registered yet. Define interval parameters to start.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedules.map((sched: any) => (
                    <div
                      key={sched.id}
                      className="border border-border/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card hover:bg-slate-500/5 duration-200"
                    >
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-foreground">{sched.name}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-500">
                            <Play className="h-3 w-3 text-emerald-500" />
                            {sched.frequency}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3 text-primary" />
                            {sched.recipients.split(",").length} recipient(s)
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-muted-foreground flex-shrink-0">
                        <p>
                          Last Run:{" "}
                          <span className="font-semibold text-foreground">
                            {sched.lastRun ? new Date(sched.lastRun).toLocaleString() : "Never"}
                          </span>
                        </p>
                        <p>
                          Next Run:{" "}
                          <span className="font-semibold text-foreground">
                            {sched.nextRun ? new Date(sched.nextRun).toLocaleString() : "Pending"}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

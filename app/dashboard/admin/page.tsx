import { auth } from "@/auth";
import { listUsersAction, listActivityLogsAction, getSystemHealthAction } from "@/actions/adminActions";
import AdminView from "@/components/AdminView";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0;

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  // Double check authorization scope
  if (session.user.role !== "Admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full glass-card border-border/40 p-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Access Denied</h3>
            <p className="text-xs text-muted-foreground">
              You do not have administrative clearance to access this control console.
            </p>
          </div>
          <Link href="/dashboard">
            <Button size="sm">Back to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  let mappedUsers: any[] = [];
  let mappedLogs: any[] = [];
  let health = {
    usersCount: 5,
    uploadsCount: 8,
    activeSchedulesCount: 4,
    failedUploadsCount: 1,
    storageMB: 24.5,
    systemStatus: "Healthy (Demo Mode)",
    dbPingMs: 0,
    cpuUsage: 11,
    memoryUsage: 35,
  };
  let isDemo = false;

  try {
    const users = await listUsersAction();
    const logs = await listActivityLogsAction();
    const liveHealth = await getSystemHealthAction();

    mappedUsers = users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
      role: u.role,
    }));

    mappedLogs = logs.map((l: any) => ({
      id: l.id,
      action: l.action,
      details: l.details,
      createdAt: l.createdAt,
      user: l.user,
    }));

    health = liveHealth;
  } catch {
    isDemo = true;
    mappedUsers = [
      { id: "mock-1", name: "Spectra Admin", email: "admin@spectra.com", createdAt: new Date(), role: { name: "Admin" } },
      { id: "mock-2", name: "Spectra Manager", email: "manager@spectra.com", createdAt: new Date(), role: { name: "Manager" } },
      { id: "mock-3", name: "Spectra Employee", email: "employee@spectra.com", createdAt: new Date(), role: { name: "Employee" } },
    ];

    mappedLogs = [
      { id: "log-1", action: "REPORT_GENERATION", details: '{"reportId":"demo-1"}', createdAt: new Date(), user: { name: "Spectra Admin", email: "admin@spectra.com" } },
      { id: "log-2", action: "UPLOAD", details: '{"fileName":"dataset.csv"}', createdAt: new Date(Date.now() - 3600000), user: { name: "Spectra Admin", email: "admin@spectra.com" } },
    ];
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">System Administration Panel</h2>
          <p className="text-xs text-muted-foreground">
            Manage user permissions, monitor system utilization, and trace database actions logs.
          </p>
        </div>
        {isDemo && (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
            Demo Panel
          </span>
        )}
      </div>

      <AdminView users={mappedUsers} logs={mappedLogs} health={health} />
    </div>
  );
}

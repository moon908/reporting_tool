import { auth } from "@/auth";
import SettingsView from "@/components/SettingsView";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  const orgId = session.user.organizationId;
  let org = { name: "Spectra Reports", brandColor: "#6366f1" };
  let mappedKeys: any[] = [];
  let isDemo = false;

  try {
    // Retrieve current organization detail
    const liveOrg = await db.organization.findUnique({
      where: { id: orgId },
    });
    if (liveOrg) {
      org = { name: liveOrg.name, brandColor: liveOrg.brandColor || "#6366f1" };
    }

    // Retrieve active API keys
    const keys = await db.apiKey.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    mappedKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      createdAt: key.createdAt,
      user: key.user,
    }));
  } catch (err) {
    isDemo = true;
    mappedKeys = [
      {
        id: "demo-key-1",
        name: "Spectra Global Ingest API Access",
        createdAt: new Date(Date.now() - 5 * 86400000),
        user: { name: "Spectra Admin", email: "admin@spectra.com" },
      },
    ];
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Global Configuration & Integration</h2>
          <p className="text-xs text-muted-foreground">
            Manage brand colors, email alert preferences, database connection parameters, and API integration keys.
          </p>
        </div>
        {isDemo && (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-500 border border-amber-500/20">
            Demo Settings
          </span>
        )}
      </div>

      <SettingsView
        initialOrg={org}
        initialKeys={mappedKeys}
        userRole={session.user.role}
      />
    </div>
  );
}

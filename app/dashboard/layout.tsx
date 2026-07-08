import { auth } from "@/auth";
import { signOutAction } from "@/actions/authActions";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Upload,
  Calendar,
  Settings,
  Shield,
  LogOut,
  Bell,
  User as UserIcon,
} from "lucide-react";
import React from "react";

interface SidebarItem {
  name: string;
  href: string;
  icon: any;
  adminOnly?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Upload Data", href: "/dashboard/upload", icon: Upload },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Schedules", href: "/dashboard/schedules", icon: Calendar },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
  { name: "Admin Panel", href: "/dashboard/admin", icon: Shield, adminOnly: true },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = session.user;
  const isAdmin = user.role === "Admin";

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-card border-r border-border/40 m-4 rounded-xl shadow-lg sticky top-4 h-[calc(100vh-2rem)]">
        {/* Brand */}
        <div className="p-6 border-b border-border/30 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">
            SR
          </div>
          <div>
            <h2 className="font-bold text-foreground text-sm leading-none">Spectra Reports</h2>
            <span className="text-[10px] text-muted-foreground">Automated Reporting</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {sidebarItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors duration-200"
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-border/30 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-foreground font-bold">
              {user.name ? user.name[0] : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{user.name || "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary mt-1 capitalize">
                {user.role}
              </span>
            </div>
          </div>

          <form action={signOutAction}>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors duration-200 text-left cursor-pointer">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-0 min-w-0">
        {/* Header Navigation */}
        <header className="h-16 border-b border-border/30 px-6 flex items-center justify-between glass-nav sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="font-semibold text-lg text-foreground md:block hidden">
              Welcome Back
            </h1>
            <div className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                SR
              </div>
              <span className="font-bold text-foreground text-sm">Spectra</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 text-muted-foreground hover:text-foreground transition-colors duration-200">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 bg-destructive rounded-full"></span>
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-foreground text-xs font-bold md:hidden">
              {user.name ? user.name[0] : "U"}
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

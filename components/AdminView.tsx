"use client";

import { updateUserRoleAction } from "@/actions/adminActions";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity } from "lucide-react";
import React, { useState } from "react";

interface AdminViewProps {
  users: Array<{ id: string; name: string | null; email: string; createdAt: Date; role: { name: string } | null }>;
  logs: Array<{ id: string; action: string; details: string | null; createdAt: Date; user: { name: string | null; email: string } | null }>;
  health: {
    usersCount: number;
    uploadsCount: number;
    activeSchedulesCount: number;
    failedUploadsCount: number;
    storageMB: number;
    systemStatus: string;
    dbPingMs: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

export default function AdminView({ users, logs, health }: AdminViewProps) {
  const [userList, setUserList] = useState(users);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserId(userId);
    const res = await updateUserRoleAction(userId, newRole);
    setUpdatingUserId(null);

    if (res.success) {
      setUserList(
        userList.map((u) => (u.id === userId ? { ...u, role: { name: newRole } } : u))
      );
    } else {
      alert("Failed to update user role.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="users" className="text-xs">User Members ({userList.length})</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">System Activity Logs</TabsTrigger>
          <TabsTrigger value="health" className="text-xs">System Health Stats</TabsTrigger>
        </TabsList>

        {/* Tab 1: Users */}
        <TabsContent value="users" className="pt-4">
          <Card className="glass-card border-border/40 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">Organization Members</CardTitle>
              <CardDescription className="text-xs">Manage user roles and authorization scopes</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/30 text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="p-3 pl-6">Name</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Joined On</th>
                      <th className="p-3">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map((user) => (
                      <tr key={user.id} className="border-b border-border/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/50">
                        <td className="p-3 pl-6 font-medium">{user.name || "N/A"}</td>
                        <td className="p-3 text-muted-foreground">{user.email}</td>
                        <td className="p-3 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <select
                            disabled={updatingUserId === user.id}
                            value={user.role?.name || "Employee"}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="h-8 border border-input bg-transparent rounded px-2 text-xs focus:ring-1 focus:ring-ring dark:bg-slate-950 font-semibold"
                          >
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Employee">Employee</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Logs */}
        <TabsContent value="logs" className="pt-4">
          <Card className="glass-card border-border/40 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold tracking-tight">System Audit Log Trail</CardTitle>
              <CardDescription className="text-xs">Trace login events, ingestions, and exports actions</CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
                  <Activity className="h-8 w-8 text-muted-foreground/45" />
                  <span>No log entries recorded.</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="border-b border-border/10 pb-3 flex items-start justify-between text-xs gap-4"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">
                          Action: <span className="text-primary font-bold">{log.action}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Details: {log.details ? String(log.details) : "No extra parameters"}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-mono">
                          Performed by: {log.user?.name || log.user?.email || "System"}
                        </p>
                      </div>
                      <span className="text-[9px] text-muted-foreground bg-slate-100 dark:bg-slate-900 rounded p-1 px-1.5 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Health */}
        <TabsContent value="health" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* System Resources Card */}
            <Card className="glass-card border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold tracking-tight">Compute Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/15">
                  <span className="text-muted-foreground">System Status</span>
                  <span className="font-bold text-emerald-500">{health.systemStatus}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/15">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <span className="font-bold">{health.cpuUsage}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Memory Usage</span>
                  <span className="font-bold">{health.memoryUsage}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Database & Queries Speed */}
            <Card className="glass-card border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold tracking-tight">Database & Ping</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/15">
                  <span className="text-muted-foreground">NeonDB Status</span>
                  <span className="font-bold text-emerald-500">Connected</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/15">
                  <span className="text-muted-foreground">Prisma Version</span>
                  <span className="font-bold font-mono">v7.8.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Query Ping Speed</span>
                  <span className="font-bold text-emerald-500">{health.dbPingMs}ms</span>
                </div>
              </CardContent>
            </Card>

            {/* Storage Allocations */}
            <Card className="glass-card border-border/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold tracking-tight">Memory Footprint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/15">
                  <span className="text-muted-foreground">Total Ingested Files</span>
                  <span className="font-bold">{health.uploadsCount}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/15">
                  <span className="text-muted-foreground">Failed Schemas</span>
                  <span className="font-bold text-destructive">{health.failedUploadsCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Storage Consumed</span>
                  <span className="font-bold">{health.storageMB} MB</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

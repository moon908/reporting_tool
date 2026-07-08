"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartsProps {
  activityData: Array<{ date: string; reports: number; uploads: number }>;
  statusData: Array<{ name: string; value: number; color: string }>;
}

export default function DashboardCharts({ activityData, statusData }: ChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Area Chart - Reports and Ingestions Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:col-span-2"
      >
        <Card className="glass-card shadow-sm border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Ingestion & Generation Activity Trend
            </CardTitle>
            <CardDescription className="text-xs">
              Daily volume of data uploads and generated PDF reports
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 23, 42, 0.9)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                <Area
                  type="monotone"
                  dataKey="reports"
                  name="Reports Generated"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReports)"
                />
                <Area
                  type="monotone"
                  dataKey="uploads"
                  name="Data Uploads"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUploads)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pie Chart - Upload Process Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="glass-card shadow-sm border-border/40 h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm font-semibold tracking-tight">
              Ingestion Status Distribution
            </CardTitle>
            <CardDescription className="text-xs">
              System health and clean-up execution split
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center h-64">
            {statusData.reduce((acc, curr) => acc + curr.value, 0) === 0 ? (
              <div className="text-xs text-muted-foreground">No ingestion status data available.</div>
            ) : (
              <>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(15, 23, 42, 0.9)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs w-full max-w-xs px-2">
                  {statusData.map((status) => (
                    <div key={status.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-muted-foreground truncate">{status.name}</span>
                      <span className="font-semibold ml-auto">{status.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

"use client";

import { createScheduleAction } from "@/actions/reportActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const scheduleSchema = z.object({
  name: z.string().min(3, "Schedule name must be at least 3 characters"),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]),
  recipients: z.string().min(5, "Please enter at least one email recipient"),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export default function ScheduleForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      frequency: "WEEKLY",
    },
  });

  const onSubmit = async (values: ScheduleFormValues) => {
    setLoading(true);
    setSuccess(false);
    setError(null);

    const res = await createScheduleAction(values);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      reset();
    } else {
      setError(res.error || "Failed to create schedule.");
    }
  };

  return (
    <Card className="glass-card border-border/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-sm font-semibold tracking-tight">Create Automation Schedule</CardTitle>
        <CardDescription className="text-xs">Schedule automated runs on the latest ingested datasets</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {success && (
            <div className="bg-emerald-500/10 text-emerald-500 text-xs p-3 rounded-lg border border-emerald-500/20">
              Automation schedule registered successfully! The cron processor will execute runs on matching frequencies.
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Schedule Name</label>
            <input
              type="text"
              placeholder="e.g. Sales Weekly Insights"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Frequency Interval</label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
              {...register("frequency")}
            >
              <option value="DAILY">Daily (Run at 9:00 AM)</option>
              <option value="WEEKLY">Weekly (Every Monday at 9:00 AM)</option>
              <option value="MONTHLY">Monthly (First of each month at 9:00 AM)</option>
              <option value="QUARTERLY">Quarterly (First of each quarter at 9:00 AM)</option>
            </select>
            {errors.frequency && <p className="text-xs text-destructive">{errors.frequency.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Recipient Emails</label>
            <input
              type="text"
              placeholder="e.g. boss@acme.com, team@acme.com"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("recipients")}
            />
            <p className="text-[10px] text-muted-foreground">Comma-separated email addresses.</p>
            {errors.recipients && <p className="text-xs text-destructive">{errors.recipients.message}</p>}
          </div>
        </CardContent>
        <div className="p-6 pt-0">
          <Button type="submit" className="w-full flex items-center justify-center gap-2 text-xs font-semibold" disabled={loading}>
            <Plus className="h-4 w-4" /> Create Schedule
          </Button>
        </div>
      </form>
    </Card>
  );
}

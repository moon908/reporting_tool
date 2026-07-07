import { db } from "@/lib/db";

export class ActivityLogRepository {
  static async logActivity(params: {
    action: string;
    userId?: string;
    organizationId?: string;
    details?: string;
    ipAddress?: string;
  }) {
    return db.activityLog.create({
      data: {
        action: params.action,
        userId: params.userId ?? null,
        organizationId: params.organizationId ?? null,
        details: params.details ?? null,
        ipAddress: params.ipAddress ?? null,
      },
    });
  }

  static async listActivities(params: {
    organizationId?: string;
    limit?: number;
    offset?: number;
  }) {
    return db.activityLog.findMany({
      where: params.organizationId ? { organizationId: params.organizationId } : undefined,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
    });
  }

  static async logAudit(params: {
    action: string;
    targetType: string;
    targetId?: string;
    details?: string;
    performedById: string;
  }) {
    return db.auditLog.create({
      data: {
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId ?? null,
        details: params.details ?? null,
        performedById: params.performedById,
      },
    });
  }

  static async listAuditLogs(params: {
    limit?: number;
    offset?: number;
  }) {
    return db.auditLog.findMany({
      include: {
        performedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
    });
  }

  static async countActivities(organizationId?: string) {
    return db.activityLog.count({
      where: organizationId ? { organizationId } : undefined,
    });
  }

  static async trackDownload(params: {
    reportId: string;
    userId: string;
    ipAddress?: string;
  }) {
    return db.download.create({
      data: {
        reportId: params.reportId,
        userId: params.userId,
        ipAddress: params.ipAddress ?? null,
      },
    });
  }

  static async listDownloads(organizationId?: string) {
    return db.download.findMany({
      where: organizationId ? {
        report: { organizationId }
      } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        report: { select: { title: true } },
      },
      orderBy: { downloadedAt: "desc" },
    });
  }

  static async countDownloads(organizationId?: string) {
    return db.download.count({
      where: organizationId ? {
        report: { organizationId }
      } : undefined,
    });
  }
}

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class ReportRepository {
  static async findById(id: string) {
    return db.report.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        dataset: {
          include: {
            processedData: {
              include: {
                insights: true,
              },
            },
          },
        },
        charts: true,
      },
    });
  }

  static async create(data: Prisma.ReportCreateInput) {
    return db.report.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.ReportUpdateInput) {
    return db.report.update({
      where: { id },
      data,
    });
  }

  static async updateStatus(id: string, status: string, fileUrl?: string) {
    return db.report.update({
      where: { id },
      data: {
        status,
        fileUrl: fileUrl ?? undefined,
      },
    });
  }

  static async listByOrganization(organizationId: string) {
    return db.report.findMany({
      where: { organizationId },
      include: {
        createdBy: { select: { name: true, email: true } },
        dataset: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listAll() {
    return db.report.findMany({
      include: {
        createdBy: { select: { name: true, email: true } },
        organization: true,
        dataset: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async countAll(organizationId?: string) {
    return db.report.count({
      where: organizationId ? { organizationId } : undefined,
    });
  }

  static async saveChart(data: Prisma.ChartUncheckedCreateInput) {
    return db.chart.create({
      data,
    });
  }

  static async getChartsForReport(reportId: string) {
    return db.chart.findMany({
      where: { reportId },
    });
  }

  static async createScheduledReport(data: Prisma.ScheduledReportUncheckedCreateInput) {
    return db.scheduledReport.create({
      data,
    });
  }

  static async listScheduledReports(organizationId?: string) {
    return db.scheduledReport.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: {
        organization: true,
      },
    });
  }

  static async countScheduledReports(organizationId?: string) {
    return db.scheduledReport.count({
      where: organizationId ? { organizationId } : undefined,
    });
  }
}

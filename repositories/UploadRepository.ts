import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class UploadRepository {
  static async findById(id: string) {
    return db.upload.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        datasets: true,
      },
    });
  }

  static async create(data: Prisma.UploadCreateInput) {
    return db.upload.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.UploadUpdateInput) {
    return db.upload.update({
      where: { id },
      data,
    });
  }

  static async updateStatus(id: string, status: string, validationErrors?: string) {
    return db.upload.update({
      where: { id },
      data: {
        status,
        validationErrors: validationErrors ?? null,
      },
    });
  }

  static async listByOrganization(organizationId: string) {
    return db.upload.findMany({
      where: { organizationId },
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listAll() {
    return db.upload.findMany({
      include: {
        uploadedBy: {
          select: { name: true, email: true },
        },
        organization: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async countAll(organizationId?: string) {
    return db.upload.count({
      where: organizationId ? { organizationId } : undefined,
    });
  }
}

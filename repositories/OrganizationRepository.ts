import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class OrganizationRepository {
  static async findById(id: string) {
    return db.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true },
        },
        settings: true,
      },
    });
  }

  static async findByName(name: string) {
    return db.organization.findFirst({
      where: { name },
    });
  }

  static async create(data: Prisma.OrganizationCreateInput) {
    return db.organization.create({
      data,
    });
  }

  static async update(id: string, data: Prisma.OrganizationUpdateInput) {
    return db.organization.update({
      where: { id },
      data,
    });
  }

  static async listAll() {
    return db.organization.findMany({
      include: {
        _count: {
          select: { users: true, reports: true },
        },
      },
    });
  }

  static async getSettings(organizationId: string) {
    return db.settings.findUnique({
      where: { organizationId },
    });
  }

  static async upsertSettings(organizationId: string, data: Partial<Prisma.SettingsCreateInput>) {
    const existing = await db.settings.findUnique({ where: { organizationId } });
    if (existing) {
      return db.settings.update({
        where: { organizationId },
        data: {
          darkModeEnabled: data.darkModeEnabled,
          defaultTemplateId: data.defaultTemplateId,
          emailConfig: data.emailConfig,
          aiConfig: data.aiConfig,
          storageSettings: data.storageSettings,
        },
      });
    } else {
      return db.settings.create({
        data: {
          organizationId,
          darkModeEnabled: data.darkModeEnabled ?? true,
          defaultTemplateId: data.defaultTemplateId,
          emailConfig: data.emailConfig,
          aiConfig: data.aiConfig,
          storageSettings: data.storageSettings,
        },
      });
    }
  }

  static async listRoles() {
    return db.role.findMany({
      include: {
        permissions: true,
      },
    });
  }

  static async findRoleByName(name: string) {
    return db.role.findUnique({
      where: { name },
      include: { permissions: true },
    });
  }

  static async listPermissions() {
    return db.permission.findMany();
  }

  static async createApiKey(data: Prisma.ApiKeyUncheckedCreateInput) {
    return db.apiKey.create({
      data,
    });
  }

  static async findApiKeyByHash(keyHash: string) {
    return db.apiKey.findUnique({
      where: { keyHash },
      include: {
        user: true,
        organization: true,
      },
    });
  }

  static async listApiKeys(organizationId: string) {
    return db.apiKey.findMany({
      where: { organizationId },
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async deleteApiKey(id: string) {
    return db.apiKey.delete({
      where: { id },
    });
  }
}

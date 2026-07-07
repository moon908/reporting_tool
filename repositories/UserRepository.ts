import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class UserRepository {
  static async findByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        organization: true,
      },
    });
  }

  static async findById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        organization: true,
      },
    });
  }

  static async create(data: Prisma.UserCreateInput) {
    return db.user.create({
      data,
      include: {
        role: true,
        organization: true,
      },
    });
  }

  static async update(id: string, data: Prisma.UserUpdateInput) {
    return db.user.update({
      where: { id },
      data,
      include: {
        role: true,
        organization: true,
      },
    });
  }

  static async delete(id: string) {
    return db.user.delete({
      where: { id },
    });
  }

  static async listByOrganization(organizationId: string) {
    return db.user.findMany({
      where: { organizationId },
      include: {
        role: true,
      },
    });
  }

  static async listAll() {
    return db.user.findMany({
      include: {
        role: true,
        organization: true,
      },
    });
  }

  static async countAll() {
    return db.user.count();
  }
}

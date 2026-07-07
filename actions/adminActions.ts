"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ActivityLogRepository } from "@/repositories/ActivityLogRepository";
import { OrganizationRepository } from "@/repositories/OrganizationRepository";
import * as crypto from "crypto";
import { revalidatePath } from "next/cache";

/**
 * Ensures user is authenticated and has Admin role.
 */
async function ensureAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "Admin") {
    throw new Error("Access denied. Admin permissions required.");
  }
  return session;
}

/**
 * List all users
 */
export async function listUsersAction() {
  await ensureAdmin();
  return db.user.findMany({
    include: {
      role: true,
      organization: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Update user's role
 */
export async function updateUserRoleAction(userId: string, roleName: string) {
  const session = await ensureAdmin();

  const role = await db.role.findUnique({
    where: { name: roleName },
  });
  if (!role) {
    return { success: false, error: "Invalid role specified." };
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: { roleId: role.id },
  });

  await ActivityLogRepository.logAudit({
    action: "USER_ROLE_UPDATE",
    targetType: "User",
    targetId: userId,
    details: `Updated role of ${updatedUser.email} to ${roleName}`,
    performedById: session.user.id,
  });

  revalidatePath("/admin");
  return { success: true };
}

/**
 * Retrieve system-wide activity logs
 */
export async function listActivityLogsAction(limit: number = 100) {
  await ensureAdmin();
  return db.activityLog.findMany({
    include: {
      user: { select: { name: true, email: true } },
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Fetch mock & live system health statistics
 */
export async function getSystemHealthAction() {
  await ensureAdmin();

  const totalUsers = await db.user.count();
  const totalUploads = await db.upload.count();
  const activeSchedules = await db.scheduledReport.count({ where: { isActive: true } });
  const failedUploads = await db.upload.count({ where: { status: "FAILED" } });
  
  // Calculate simulated storage (e.g. cumulative file size in MB)
  const uploadsSizes = await db.upload.aggregate({
    _sum: {
      fileSize: true,
    },
  });
  const totalSizeBytes = uploadsSizes._sum.fileSize || 0;
  const storageMB = Number((totalSizeBytes / (1024 * 1024)).toFixed(2));

  return {
    usersCount: totalUsers,
    uploadsCount: totalUploads,
    activeSchedulesCount: activeSchedules,
    failedUploadsCount: failedUploads,
    storageMB,
    systemStatus: "Healthy",
    dbPingMs: 12, // mock database speed
    cpuUsage: 14, // mock cpu
    memoryUsage: 48, // mock memory
  };
}

/**
 * Update organization settings (branding and config)
 */
export async function saveOrganizationSettingsAction(formData: {
  name?: string;
  brandColor?: string;
  darkModeEnabled?: boolean;
  emailConfig?: string;
  aiConfig?: string;
}) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Access denied." };
  }

  // Allow Admin or Manager to modify settings
  if (session.user.role !== "Admin" && session.user.role !== "Manager") {
    return { success: false, error: "Manager/Admin permissions required." };
  }

  const orgId = session.user.organizationId;

  try {
    if (formData.name) {
      await db.organization.update({
        where: { id: orgId },
        data: {
          name: formData.name,
          brandColor: formData.brandColor,
        },
      });
    }

    await OrganizationRepository.upsertSettings(orgId, {
      darkModeEnabled: formData.darkModeEnabled,
      emailConfig: formData.emailConfig,
      aiConfig: formData.aiConfig,
    });

    await ActivityLogRepository.logActivity({
      action: "USER_ACTION",
      userId: session.user.id,
      organizationId: orgId,
      details: "Updated organization branding and configuration settings.",
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new API Key for integrations
 */
export async function createApiKeyAction(keyName: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    return { success: false, error: "Auth required." };
  }

  try {
    // Generate a secure API Key
    const rawKey = "agy_" + crypto.randomBytes(24).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    await OrganizationRepository.createApiKey({
      name: keyName,
      keyHash,
      scopes: JSON.stringify(["read:reports", "write:reports"]),
      userId: session.user.id,
      organizationId: session.user.organizationId,
    });

    await ActivityLogRepository.logActivity({
      action: "USER_ACTION",
      userId: session.user.id,
      organizationId: session.user.organizationId,
      details: `Generated API Key: ${keyName}`,
    });

    revalidatePath("/settings");

    // Return raw key ONCE to the user to save it
    return { success: true, apiKey: rawKey };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * List API Keys
 */
export async function listApiKeysAction() {
  const session = await auth();
  if (!session?.user?.organizationId) return [];
  return OrganizationRepository.listApiKeys(session.user.organizationId);
}

/**
 * Delete API Key
 */
export async function deleteApiKeyAction(keyId: string) {
  const session = await auth();
  if (!session?.user?.organizationId) {
    return { success: false, error: "Access denied." };
  }

  await OrganizationRepository.deleteApiKey(keyId);

  await ActivityLogRepository.logActivity({
    action: "USER_ACTION",
    userId: session.user.id,
    organizationId: session.user.organizationId,
    details: `Revoked API Key ID: ${keyId}`,
  });

  revalidatePath("/settings");
  return { success: true };
}

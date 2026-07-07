import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Create Permissions
  const permissionsData = [
    { name: "read:reports" },
    { name: "write:reports" },
    { name: "delete:reports" },
    { name: "manage:users" },
    { name: "manage:organization" },
    { name: "view:dashboard" },
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionsData) {
    const createdPerm = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    permissions[perm.name] = createdPerm;
    console.log(`Permission upserted: ${perm.name}`);
  }

  // 2. Create Roles and connect permissions
  const rolesConfig = [
    {
      name: "Admin",
      perms: ["read:reports", "write:reports", "delete:reports", "manage:users", "manage:organization", "view:dashboard"],
    },
    {
      name: "Manager",
      perms: ["read:reports", "write:reports", "view:dashboard"],
    },
    {
      name: "Employee",
      perms: ["read:reports", "view:dashboard"],
    },
  ];

  const roles: Record<string, any> = {};
  for (const roleConf of rolesConfig) {
    const createdRole = await prisma.role.upsert({
      where: { name: roleConf.name },
      update: {
        permissions: {
          set: roleConf.perms.map((pName) => ({ id: permissions[pName].id })),
        },
      },
      create: {
        name: roleConf.name,
        permissions: {
          connect: roleConf.perms.map((pName) => ({ id: permissions[pName].id })),
        },
      },
    });
    roles[roleConf.name] = createdRole;
    console.log(`Role upserted: ${roleConf.name} with ${roleConf.perms.length} permissions`);
  }

  // 3. Create Default Organization
  const defaultOrg = await prisma.organization.upsert({
    where: { id: "default-org-id" },
    update: {},
    create: {
      id: "default-org-id",
      name: "Acme Analytics",
      brandColor: "#3b82f6",
      logoUrl: "",
    },
  });
  console.log(`Organization upserted: ${defaultOrg.name}`);

  // Create default Settings for Organization
  await prisma.settings.upsert({
    where: { organizationId: defaultOrg.id },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      darkModeEnabled: true,
      emailConfig: JSON.stringify({ from: "reports@acme.com" }),
      aiConfig: JSON.stringify({ model: "gpt-4o" }),
    },
  });

  // 4. Create Default Users (Admin, Manager, Employee)
  const hashedAdminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@acme.com" },
    update: {
      roleId: roles["Admin"].id,
      organizationId: defaultOrg.id,
    },
    create: {
      email: "admin@acme.com",
      name: "Acme Admin",
      password: hashedAdminPassword,
      roleId: roles["Admin"].id,
      organizationId: defaultOrg.id,
    },
  });
  console.log(`Admin user upserted: ${adminUser.email}`);

  const hashedManagerPassword = await bcrypt.hash("manager123", 10);
  const managerUser = await prisma.user.upsert({
    where: { email: "manager@acme.com" },
    update: {
      roleId: roles["Manager"].id,
      organizationId: defaultOrg.id,
    },
    create: {
      email: "manager@acme.com",
      name: "Acme Manager",
      password: hashedManagerPassword,
      roleId: roles["Manager"].id,
      organizationId: defaultOrg.id,
    },
  });
  console.log(`Manager user upserted: ${managerUser.email}`);

  const hashedEmployeePassword = await bcrypt.hash("employee123", 10);
  const employeeUser = await prisma.user.upsert({
    where: { email: "employee@acme.com" },
    update: {
      roleId: roles["Employee"].id,
      organizationId: defaultOrg.id,
    },
    create: {
      email: "employee@acme.com",
      name: "Acme Employee",
      password: hashedEmployeePassword,
      roleId: roles["Employee"].id,
      organizationId: defaultOrg.id,
    },
  });
  console.log(`Employee user upserted: ${employeeUser.email}`);

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

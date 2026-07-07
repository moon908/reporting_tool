"use server";

import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { UserRepository } from "@/repositories/UserRepository";
import * as bcrypt from "bcryptjs";
import { AuthError } from "next-auth";

/**
 * Handles credentials signup
 */
export async function signUpAction(formData: any) {
  const { name, email, password } = formData;

  if (!email || !password || !name) {
    return { success: false, error: "Please fill in all fields." };
  }

  try {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      return { success: false, error: "User already exists with this email." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Find default Employee role
    let role = await db.role.findUnique({ where: { name: "Employee" } });
    if (!role) {
      role = await db.role.create({ data: { name: "Employee" } });
    }

    // Associate with default org
    let org = await db.organization.findUnique({ where: { id: "default-org-id" } });
    if (!org) {
      org = await db.organization.create({
        data: {
          id: "default-org-id",
          name: "Acme Analytics",
          brandColor: "#3b82f6",
        },
      });
    }

    await UserRepository.create({
      name,
      email,
      password: hashedPassword,
      roleId: role.id,
      organizationId: org.id,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Signup Action Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

/**
 * Handles credentials sign in
 */
export async function signInAction(prevState: any, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || !password) {
    return { error: "Please enter email and password." };
  }

  try {
    await signIn("credentials", {
      email: String(email),
      password: String(password),
      redirectTo: "/dashboard",
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials. Please check your email and password." };
        default:
          return { error: "Something went wrong during login." };
      }
    }
    throw error;
  }
}

/**
 * Handles credentials sign out
 */
export async function signOutAction() {
  await signOut({ redirectTo: "/auth/login" });
}

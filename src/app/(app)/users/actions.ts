"use server";

import { hash } from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { userPermissions, users } from "@/db/schema/tables";
import { ActionError, type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import {
  ACTIONS,
  RESOURCES,
  RESOURCE_ACTIONS,
  type Action,
  type Resource,
  type User,
  type UserPermission,
} from "@/lib/types";

const optionalText = z
  .string()
  .trim()
  .default("")
  .transform((value) => value || null);

const userInput = z.object({
  username: z.string().trim().min(1, "Username is required"),
  email: optionalText,
  displayName: optionalText,
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
  isAdmin: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export type UserInput = z.input<typeof userInput>;

export async function listUsers(): Promise<ActionResult<User[]>> {
  return runAction(async () => {
    await requirePermission("users", "read");
    return db.select().from(users).orderBy(asc(users.username));
  });
}

export async function getUser(id: string): Promise<ActionResult<User | null>> {
  return runAction(async () => {
    await requirePermission("users", "read");
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user ?? null;
  });
}

export async function createUser(
  input: UserInput,
): Promise<ActionResult<User>> {
  return runAction(async () => {
    await requirePermission("users", "create");
    const validated = userInput.parse(input);

    // Check username is unique
    const existing = await db.query.users.findFirst({
      where: eq(users.username, validated.username),
    });
    if (existing) {
      throw new ActionError("Username already exists");
    }

    // Hash password
    if (!validated.password) {
      throw new ActionError("Password is required for new users");
    }
    const passwordHash = await hash(validated.password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        username: validated.username,
        email: validated.email,
        displayName: validated.displayName,
        passwordHash,
        isAdmin: validated.isAdmin,
        isActive: validated.isActive,
      })
      .returning();

    return newUser;
  });
}

export async function updateUser(
  id: string,
  input: Omit<UserInput, "password">,
): Promise<ActionResult<User>> {
  return runAction(async () => {
    await requirePermission("users", "update");
    const validated = userInput.omit({ password: true }).parse(input);

    // Check username uniqueness (excluding current user)
    const existing = await db.query.users.findFirst({
      where: eq(users.username, validated.username),
    });
    if (existing && existing.id !== id) {
      throw new ActionError("Username already exists");
    }

    const [updated] = await db
      .update(users)
      .set({
        username: validated.username,
        email: validated.email,
        displayName: validated.displayName,
        isAdmin: validated.isAdmin,
        isActive: validated.isActive,
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) throw new ActionError("User not found");
    return updated;
  });
}

export async function deleteUser(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("users", "delete");

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    if (!user) throw new ActionError("User not found");

    // Prevent deleting the last admin
    if (user.isAdmin) {
      const adminCount = await db.query.users.findMany({
        where: eq(users.isAdmin, true),
      });
      if (adminCount.length === 1) {
        throw new ActionError("Cannot delete the last admin user");
      }
    }

    await db.delete(users).where(eq(users.id, id));
    return null;
  });
}

export async function getUserPermissions(
  userId: string,
): Promise<ActionResult<UserPermission[]>> {
  return runAction(async () => {
    await requirePermission("users", "read");
    return db.query.userPermissions.findMany({
      where: eq(userPermissions.userId, userId),
    });
  });
}

export async function updateUserPermissions(
  userId: string,
  permissions: Array<{ resource: Resource; action: Action }>,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("users", "update");

    // Clear existing permissions
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));

    // Insert new permissions
    if (permissions.length > 0) {
      await db.insert(userPermissions).values(
        permissions.map((p) => ({
          userId,
          resource: p.resource,
          action: p.action,
        })),
      );
    }

    return null;
  });
}

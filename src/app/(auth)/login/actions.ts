"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema/tables";
import type { ActionResult } from "@/lib/action-result";
import { ensureBootstrapAdmin } from "@/lib/auth/bootstrap";
import { createSession, destroySession } from "@/lib/auth/session";

export type Credentials = { username: string; password: string };

/**
 * §5 login. Returns its failures rather than throwing them, so the form can
 * show the message Next would otherwise replace in production.
 */
export async function login({
  username,
  password,
}: Credentials): Promise<ActionResult<null>> {
  await ensureBootstrapAdmin();

  const user = await db.query.users.findFirst({
    where: eq(users.username, username.trim()),
  });

  // The spec's wording for both cases: an unknown name and a disabled account
  // are the same answer to whoever is asking.
  if (!user || !user.isActive) {
    return { ok: false, error: "Account disabled or not found" };
  }

  if (!(await compare(password, user.passwordHash))) {
    return { ok: false, error: "Invalid username or password" };
  }

  await createSession(user.id);
  return { ok: true, data: null };
}

export async function logout(): Promise<ActionResult<null>> {
  await destroySession();
  return { ok: true, data: null };
}

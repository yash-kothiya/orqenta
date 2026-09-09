/**
 * §5 — the session cookie and the user behind it.
 *
 * Permissions are read fresh on every request rather than baked into the token:
 * revoking a permission or disabling an account has to take effect immediately,
 * and a JWT cannot be un-issued.
 */

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema/tables";
import { env } from "@/lib/env";
import type { Action, Resource, SessionUser } from "@/lib/types";
import { signSession, verifySession } from "./jwt";
import { assertPermission } from "./permissions";

export const SESSION_COOKIE = "orqenta_session";

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    path: "/",
    maxAge: env.SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Never throws — callers decide what null means. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const claims = await verifySession(token);
  if (!claims) return null;

  const row = await db.query.users.findFirst({
    where: eq(users.id, claims.sub),
    with: { permissions: true },
  });

  // A disabled account keeps its cookie but stops being a session (§5).
  if (!row || !row.isActive) return null;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.displayName,
    isAdmin: row.isAdmin,
    isActive: row.isActive,
    permissions: row.permissions.map((p) => ({
      resource: p.resource,
      action: p.action,
    })),
  };
}

/** The first line of every server action. Redirects instead of returning null. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** The two lines every server action starts with (§6.1). */
export async function requirePermission(
  resource: Resource,
  action: Action,
): Promise<SessionUser> {
  const user = await requireUser();
  assertPermission(user, resource, action);
  return user;
}

import { hash } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema/tables";
import { env } from "@/lib/env";

/**
 * §5 — first run: an empty `users` table gets an admin from the environment,
 * so a fresh database is reachable without a seed step.
 *
 * ponytail: called from the login action rather than at boot. Instrumentation
 * also runs during `next build`, which has no database, and this is the only
 * path that needs a user to exist.
 */
export async function ensureBootstrapAdmin() {
  const existing = await db.query.users.findFirst({ columns: { id: true } });
  if (existing) return;

  await db
    .insert(users)
    .values({
      username: env.ADMIN_USER,
      passwordHash: await hash(env.ADMIN_PASS, 10),
      displayName: "Administrator",
      isAdmin: true,
    })
    // Two first logins at once would both see an empty table; the unique index
    // settles it and the loser carries on to the password check.
    .onConflictDoNothing();
}

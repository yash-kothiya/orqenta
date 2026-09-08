/**
 * §12 — the environment, parsed once at boot.
 *
 * Importing this module validates: `src/instrumentation.ts` pulls it in before
 * the first request, so a missing secret fails the boot rather than surfacing
 * as a broken login an hour later. Server-side only — nothing in a client
 * component may import it.
 */
import { z } from "zod";

const required = z.string().trim().min(1);

const schema = z.object({
  DATABASE_URL: required,
  ADMIN_USER: required,
  ADMIN_PASS: required,
  JWT_SECRET: required,

  /** Session lifetime; the spec clamps it rather than rejecting odd values. */
  SESSION_TTL_SECONDS: z.coerce
    .number()
    .int()
    .default(3600)
    .transform((n) => Math.min(43200, Math.max(300, n))),
  COOKIE_SECURE: z.stringbool().default(true),

  RATE_LIMIT_ENABLED: z.stringbool().default(true),
  RATE_LIMIT_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(900),
});

export type Env = z.infer<typeof schema>;

/** A blank variable is an unset one — otherwise `FOO=` would coerce to 0. */
const present = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value?.trim()),
);

const parsed = schema.safeParse(present);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Environment is not usable — see .env.example.\n${problems}`);
}

export const env: Env = parsed.data;

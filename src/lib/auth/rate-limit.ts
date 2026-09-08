import { env } from "@/lib/env";

/**
 * §5 — 5 failed logins per username+IP per 15 minutes.
 *
 * ponytail: in-process Map, so the counters are per server instance and reset
 * on deploy. That is the right size for one node process; move the window into
 * Postgres or Redis the day this runs behind more than one.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

/** Seconds the caller must wait, or 0 when the attempt may proceed. */
export function retryAfter(key: string): number {
  if (!env.RATE_LIMIT_ENABLED) return 0;

  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= Date.now()) return 0;
  if (entry.count < env.RATE_LIMIT_MAX_ATTEMPTS) return 0;

  return Math.ceil((entry.resetAt - Date.now()) / 1000);
}

/** Counts one failure. The window opens at the first failure, not the fifth. */
export function recordFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    // Nothing prunes this map on a timer, so drop the dead entries whenever it
    // grows enough to be worth a pass.
    if (attempts.size > 1000) {
      for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
    }
    attempts.set(key, {
      count: 1,
      resetAt: now + env.RATE_LIMIT_WINDOW_SECONDS * 1000,
    });
    return;
  }

  entry.count += 1;
}

/** A successful login forgives the failures before it. */
export function clearAttempts(key: string): void {
  attempts.delete(key);
}

/** One bucket per username and origin, so one attacker cannot lock out a user. */
export const attemptKey = (username: string, ip: string) =>
  `${username.trim().toLowerCase()}|${ip}`;

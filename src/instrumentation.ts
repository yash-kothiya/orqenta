/**
 * Next calls this once per server process, before anything is served. Importing
 * the env module is the whole point: it throws on a bad `.env` here, at boot,
 * instead of at the first request that needs a secret (§12).
 */
export async function register() {
  await import("@/lib/env");
}

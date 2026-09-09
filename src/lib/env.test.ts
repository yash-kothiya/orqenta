import { afterEach, describe, expect, it, vi } from "vitest";

const REQUIRED = {
  DATABASE_URL: "postgres://localhost:5433/orqenta",
  ADMIN_USER: "admin",
  ADMIN_PASS: "supersecret",
  JWT_SECRET: "signing-key",
};

/** env.ts validates on import, so each case needs a fresh module registry. */
async function loadEnv(overrides: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({ ...REQUIRED, ...overrides })) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  return (await import("./env")).env;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env", () => {
  it("fills in the optional values", async () => {
    await expect(loadEnv()).resolves.toEqual({
      ...REQUIRED,
      SESSION_TTL_SECONDS: 3600,
      COOKIE_SECURE: true,
      RATE_LIMIT_ENABLED: true,
      RATE_LIMIT_MAX_ATTEMPTS: 5,
      RATE_LIMIT_WINDOW_SECONDS: 900,
    });
  });

  it("clamps the session lifetime to 300-43200", async () => {
    expect(
      (await loadEnv({ SESSION_TTL_SECONDS: "60" })).SESSION_TTL_SECONDS,
    ).toBe(300);
    expect(
      (await loadEnv({ SESSION_TTL_SECONDS: "99999" })).SESSION_TTL_SECONDS,
    ).toBe(43200);
  });

  it("reads the booleans as written", async () => {
    const env = await loadEnv({
      COOKIE_SECURE: "false",
      RATE_LIMIT_ENABLED: "false",
    });
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.RATE_LIMIT_ENABLED).toBe(false);
  });

  it("refuses to load without a signing key", async () => {
    await expect(loadEnv({ JWT_SECRET: "   " })).rejects.toThrow(/JWT_SECRET/);
  });

  it("names every missing variable at once", async () => {
    await expect(loadEnv({ ADMIN_USER: "", ADMIN_PASS: "" })).rejects.toThrow(
      /ADMIN_USER[\s\S]*ADMIN_PASS/,
    );
  });

  it("treats a blank optional value as unset instead of zero", async () => {
    expect(
      (await loadEnv({ SESSION_TTL_SECONDS: "" })).SESSION_TTL_SECONDS,
    ).toBe(3600);
  });
});

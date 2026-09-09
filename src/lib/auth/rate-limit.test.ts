import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ENV = {
  DATABASE_URL: "postgres://localhost:5433/orqenta",
  ADMIN_USER: "admin",
  ADMIN_PASS: "supersecret",
  JWT_SECRET: "signing-key",
  RATE_LIMIT_MAX_ATTEMPTS: "3",
  RATE_LIMIT_WINDOW_SECONDS: "900",
};

/** Fresh module each time: the counters live in a module-level Map. */
async function loadLimiter(overrides: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({ ...ENV, ...overrides })) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  return import("./rate-limit");
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("login rate limit", () => {
  it("allows attempts up to the limit", async () => {
    const { attemptKey, recordFailure, retryAfter } = await loadLimiter();
    const key = attemptKey("Kim", "10.0.0.1");

    expect(retryAfter(key)).toBe(0);
    recordFailure(key);
    recordFailure(key);
    expect(retryAfter(key)).toBe(0);
  });

  it("blocks once the limit is reached, for the rest of the window", async () => {
    const { attemptKey, recordFailure, retryAfter } = await loadLimiter();
    const key = attemptKey("kim", "10.0.0.1");

    for (let i = 0; i < 3; i++) recordFailure(key);
    expect(retryAfter(key)).toBe(900);

    vi.advanceTimersByTime(890_000);
    expect(retryAfter(key)).toBe(10);

    vi.advanceTimersByTime(11_000);
    expect(retryAfter(key)).toBe(0);
  });

  it("counts each username and origin separately", async () => {
    const { attemptKey, recordFailure, retryAfter } = await loadLimiter();
    const mine = attemptKey("kim", "10.0.0.1");

    for (let i = 0; i < 3; i++) recordFailure(mine);
    expect(retryAfter(attemptKey("kim", "10.0.0.2"))).toBe(0);
    expect(retryAfter(attemptKey("sam", "10.0.0.1"))).toBe(0);
  });

  it("ignores case and padding in the username", async () => {
    const { attemptKey } = await loadLimiter();
    expect(attemptKey("  KIM ", "10.0.0.1")).toBe(
      attemptKey("kim", "10.0.0.1"),
    );
  });

  it("forgives the failures after a successful login", async () => {
    const { attemptKey, clearAttempts, recordFailure, retryAfter } =
      await loadLimiter();
    const key = attemptKey("kim", "10.0.0.1");

    for (let i = 0; i < 3; i++) recordFailure(key);
    clearAttempts(key);
    expect(retryAfter(key)).toBe(0);
  });

  it("does nothing when the limiter is switched off", async () => {
    const { attemptKey, recordFailure, retryAfter } = await loadLimiter({
      RATE_LIMIT_ENABLED: "false",
    });
    const key = attemptKey("kim", "10.0.0.1");

    for (let i = 0; i < 10; i++) recordFailure(key);
    expect(retryAfter(key)).toBe(0);
  });
});

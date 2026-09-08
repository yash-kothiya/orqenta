import { afterEach, describe, expect, it, vi } from "vitest";

const REQUIRED = {
  DATABASE_URL: "postgres://localhost:5433/orqenta",
  ADMIN_USER: "admin",
  ADMIN_PASS: "supersecret",
  JWT_SECRET: "signing-key",
};

/** env is read at import time, and the HMAC key is cached per module instance. */
async function loadJwt(secret = REQUIRED.JWT_SECRET) {
  for (const [key, value] of Object.entries({
    ...REQUIRED,
    JWT_SECRET: secret,
  })) {
    vi.stubEnv(key, value);
  }
  vi.resetModules();
  return import("./jwt");
}

const base64url = (value: unknown) =>
  btoa(JSON.stringify(value))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session tokens", () => {
  it("round-trips the user id", async () => {
    const { signSession, verifySession } = await loadJwt();
    const claims = await verifySession(await signSession("usr_1"));
    expect(claims?.sub).toBe("usr_1");
    expect(claims?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("rejects a token that has expired", async () => {
    const { signSession, verifySession } = await loadJwt();
    expect(await verifySession(await signSession("usr_1", -1))).toBeNull();
  });

  it("rejects a payload swapped under a valid signature", async () => {
    const { signSession, verifySession } = await loadJwt();
    const [header, , signature] = (await signSession("usr_1")).split(".");
    const forged = base64url({
      sub: "usr_admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(await verifySession(`${header}.${forged}.${signature}`)).toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const { signSession } = await loadJwt("first-secret");
    const token = await signSession("usr_1");
    const { verifySession } = await loadJwt("second-secret");
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects an unsigned token, whatever its header claims", async () => {
    const { verifySession } = await loadJwt();
    const header = base64url({ alg: "none", typ: "JWT" });
    const payload = base64url({
      sub: "usr_admin",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(await verifySession(`${header}.${payload}.`)).toBeNull();
    expect(await verifySession(`${header}.${payload}`)).toBeNull();
  });

  it("rejects anything that is not a token", async () => {
    const { verifySession } = await loadJwt();
    expect(await verifySession("")).toBeNull();
    expect(await verifySession("not.a.token")).toBeNull();
  });
});

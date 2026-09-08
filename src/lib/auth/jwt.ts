/**
 * §5 — the session token: a plain HS256 JWT over Web Crypto.
 *
 * `crypto.subtle` is in both the Node and the edge runtime, so this works
 * wherever Next decides to run it and costs no dependency. The header's `alg`
 * is never read: HS256 is the only algorithm this file will verify, which is
 * what makes the classic algorithm-confusion swap impossible.
 */
import { env } from "@/lib/env";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export type SessionClaims = { sub: string; exp: number };

let signingKey: Promise<CryptoKey> | undefined;

function key() {
  if (!signingKey) {
    signingKey = crypto.subtle.importKey(
      "raw",
      encoder.encode(env.JWT_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return signingKey;
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

const encodeJson = (value: unknown) =>
  toBase64Url(encoder.encode(JSON.stringify(value)));

/** Signs a session for `userId`, expiring after the configured TTL. */
export async function signSession(
  userId: string,
  ttlSeconds = env.SESSION_TTL_SECONDS,
): Promise<string> {
  const body = [
    encodeJson({ alg: "HS256", typ: "JWT" }),
    encodeJson({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    }),
  ].join(".");

  const signature = await crypto.subtle.sign(
    "HMAC",
    await key(),
    encoder.encode(body),
  );

  return `${body}.${toBase64Url(new Uint8Array(signature))}`;
}

/** The claims, or null for anything tampered with, malformed or expired. */
export async function verifySession(
  token: string,
): Promise<SessionClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await key(),
      fromBase64Url(signature),
      encoder.encode(`${header}.${payload}`),
    );
    if (!valid) return null;

    const claims = JSON.parse(decoder.decode(fromBase64Url(payload)));
    if (typeof claims?.sub !== "string" || typeof claims?.exp !== "number") {
      return null;
    }
    return claims.exp * 1000 > Date.now() ? claims : null;
  } catch {
    // Malformed base64 or JSON is just an invalid token, not a crash.
    return null;
  }
}

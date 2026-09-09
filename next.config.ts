import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * §12. The spec's policy has no `script-src`, which would fall through to
 * `default-src 'self'` and block the inline bootstrap script the App Router
 * streams every RSC payload through — a blank page, not a hardening win. So
 * scripts get 'unsafe-inline' explicitly, and dev additionally gets
 * 'unsafe-eval' for React Refresh.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
].join("; ");

const denied = [
  "accelerometer",
  "autoplay",
  "camera",
  "geolocation",
  "gyroscope",
  "magnetometer",
  "microphone",
  "payment",
  "usb",
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: denied.map((feature) => `${feature}=()`).join(", "),
  },
  { key: "Content-Security-Policy", value: csp },
  // Optional per §12, and actively harmful over plain http, so it follows the
  // same switch as the secure cookie.
  ...(process.env.COOKIE_SECURE === "true"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

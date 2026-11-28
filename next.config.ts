import type { NextConfig } from "next";

const config: NextConfig = {
  // Keep production verification from replacing a running dev server's output.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  poweredByHeader: false,
  experimental: { agentUpgrade: "security" },
  serverExternalPackages: ["pdf-lib"],
  outputFileTracingIncludes: {
    "/api/pathway-applications": ["./scripts/pdf-validation-worker.mjs"],
  },
  async redirects() {
    return [
      { source: "/whats-next", destination: "/#events", permanent: true },
      { source: "/events", destination: "/#events", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com" +
              (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") +
              "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tiles.openfreemap.org; font-src 'self'; connect-src 'self' https://challenges.cloudflare.com https://tiles.openfreemap.org; worker-src 'self' blob:; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
          },
        ],
      },
    ];
  },
};
export default config;

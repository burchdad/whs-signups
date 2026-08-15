import type { NextConfig } from "next";

const scriptSources = process.env.NODE_ENV === "development"
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Content-Security-Policy", value: `default-src 'self'; ${scriptSources}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests` },
      ],
    }];
  },
};

export default nextConfig;

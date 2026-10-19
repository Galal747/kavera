import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// صفحات خاصة: محركات البحث ما تفهرسهاش
const PRIVATE_PATHS = [
  "admin",
  "account",
  "cart",
  "checkout",
  "wishlist",
  "login",
  "register",
  "forgot-password",
  "reset-password",
];

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      ...PRIVATE_PATHS.map((path) => ({
        source: `/${path}/:path*`,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
  images: {
    remotePatterns: supabaseUrl
      ? [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
            pathname: "/storage/v1/object/public/product-images/**",
          },
        ]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
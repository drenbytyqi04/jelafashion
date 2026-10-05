import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The floating dev badge sits over the cookie banner's buttons in local QA.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Product and site images from Supabase Storage's public buckets.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Illustrative Unsplash photos used until the atelier's own photography is uploaded.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-*" },
    ],
  },
  // Baseline security headers on every response. No script CSP: nonces would force every
  // page to render per request (no static pages, slower LCP), and the tag loaders are
  // inline. What a CSP can do without nonces is here: no framing by other sites, no
  // <base> hijack, no plugins.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      // Payment proofs (images or PDF) up to 10 MB, plus multipart overhead.
      bodySizeLimit: "11mb",
    },
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);

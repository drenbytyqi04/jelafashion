import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The floating dev badge sits over the cookie banner's buttons in local QA.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Product and site images from Supabase Storage's public buckets.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
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

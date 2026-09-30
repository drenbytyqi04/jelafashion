import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Private and transactional pages stay out of search results (they also carry noindex).
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["pagesa", "checkout", "shporta", "cart", "llogaria", "account", "porosia", "order", "kerko", "search", "te-preferuarat", "wishlist", "styleguide"];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", ...privatePaths.flatMap((p) => [`/sq/${p}`, `/en/${p}`])],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

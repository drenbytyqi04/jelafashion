import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getCatalog } from "@/lib/catalog/repository";
import { absoluteUrl, localizedPath, type StaticHref } from "@/lib/seo";

// Every public page in both languages, each entry listing its translations (hreflang).
// Checkout, cart, account, order, search and saved dresses are left out on purpose.

export const revalidate = 3600;

const PAGES: { href: StaticHref; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { href: "/", priority: 1, changeFrequency: "weekly" },
  { href: "/bridal", priority: 0.9, changeFrequency: "weekly" },
  { href: "/evening", priority: 0.9, changeFrequency: "weekly" },
  { href: "/short", priority: 0.8, changeFrequency: "weekly" },
  { href: "/shop", priority: 0.8, changeFrequency: "weekly" },
  { href: "/new-in", priority: 0.7, changeFrequency: "daily" },
  { href: "/made-to-measure", priority: 0.9, changeFrequency: "monthly" },
  { href: "/size-guide", priority: 0.6, changeFrequency: "yearly" },
  { href: "/atelier", priority: 0.6, changeFrequency: "yearly" },
  { href: "/contact", priority: 0.6, changeFrequency: "yearly" },
  { href: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { href: "/shipping", priority: 0.4, changeFrequency: "monthly" },
  { href: "/returns", priority: 0.3, changeFrequency: "yearly" },
  { href: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { href: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { href: "/cookies", priority: 0.1, changeFrequency: "yearly" },
];

type Href = Parameters<typeof localizedPath>[1];

function entries(href: Href, extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(localizedPath(l, href))]));
  return routing.locales.map((l) => ({ url: languages[l], alternates: { languages: { ...languages, "x-default": languages.sq } }, ...extra }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getCatalog();
  return [
    ...PAGES.flatMap((p) => entries(p.href, { priority: p.priority, changeFrequency: p.changeFrequency })),
    ...products.flatMap((p) =>
      entries({ pathname: "/dress/[slug]", params: { slug: p.slug } }, { lastModified: p.publishedAt, priority: 0.8, changeFrequency: "weekly" }),
    ),
  ];
}

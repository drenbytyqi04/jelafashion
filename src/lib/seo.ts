import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type AppPathname } from "@/i18n/routing";
import type { Locale } from "@/lib/catalog/types";
import { site } from "@/lib/site";

type Href = Parameters<typeof getPathname>[0]["href"];

const OG_LOCALE: Record<Locale, string> = { sq: "sq_AL", en: "en_US" };

export const absoluteUrl = (path: string) => new URL(path, site.url).toString();
export const localizedPath = (locale: Locale, href: Href) => getPathname({ locale, href });

/**
 * Canonical, hreflang alternates (sq, en, x-default → sq) and Open Graph for one page.
 * Titles get the " | Jela Fashion" suffix from the layout template.
 */
export function pageMetadata({
  locale,
  href,
  title,
  description,
  image,
  noindex,
  absoluteTitle,
  type = "website",
}: {
  locale: Locale;
  href: Href;
  title: string;
  description?: string;
  image?: { url: string; width?: number; height?: number; alt?: string } | null;
  noindex?: boolean;
  /** Use the title as is, without the " | Jela Fashion" suffix (home page). */
  absoluteTitle?: boolean;
  type?: "website" | "article";
}): Metadata {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, localizedPath(l, href)]));
  const url = localizedPath(locale, href);
  const full = absoluteTitle ? title : `${title} | ${site.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: { ...languages, "x-default": languages.sq } },
    openGraph: {
      type,
      url,
      title: full,
      description,
      siteName: site.name,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      // A page's own openGraph replaces the inherited one, image included: fall back to
      // the shared preview (app/[locale]/opengraph-image) explicitly.
      images: [image ?? { url: `/${locale}/opengraph-image`, width: 1200, height: 630, alt: site.name }],
    },
    twitter: { card: "summary_large_image", title: full, description },
    ...(noindex && { robots: { index: false, follow: true } }),
  };
}

export type Crumb = { name: string; href: Href };

export function breadcrumbJsonLd(locale: Locale, crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(localizedPath(locale, c.href)),
    })),
  };
}

export type StaticHref = Exclude<AppPathname, `${string}[${string}`>;

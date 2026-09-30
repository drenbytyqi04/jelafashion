// Contact details come from env vars until the admin panel (Phase 5) stores them.
// Anything unconfirmed stays a visible [PLACEHOLDER], per the fact rules in CLAUDE.md.

/**
 * Canonical origin for metadata, sitemap and shared links. NEXT_PUBLIC_SITE_URL once the
 * domain is set; until then Vercel's production URL, so a first deploy never publishes
 * localhost canonicals.
 */
function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export const site = {
  name: "Jela Fashion",
  city: "Prizren",
  instagramHandle: "jelafashionpz",
  instagramUrl: "https://www.instagram.com/jelafashionpz/",
  url: siteUrl(),
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "",
} as const;

/** wa.me link with an optional pre-filled message, or null when no number is configured. */
export function whatsappHref(message?: string): string | null {
  const digits = site.whatsappNumber.replace(/\D/g, "");
  if (!digits) return null;
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

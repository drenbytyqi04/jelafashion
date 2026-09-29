// Contact details come from env vars until the admin panel (Phase 5) stores them.
// Anything unconfirmed stays a visible [PLACEHOLDER], per the fact rules in CLAUDE.md.

export const site = {
  name: "Jela Fashion",
  city: "Prizren",
  instagramHandle: "jelafashionpz",
  instagramUrl: "https://www.instagram.com/jelafashionpz/",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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

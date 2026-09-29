import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Styleguide } from "./styleguide";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false, follow: false } };

// Development reference for the Phase 1 components. Not available in production builds
// unless NEXT_PUBLIC_ENABLE_STYLEGUIDE=1.
export default async function StyleguidePage({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_ENABLE_STYLEGUIDE !== "1") notFound();
  const { locale } = await params;
  setRequestLocale(locale as "sq" | "en");
  return <Styleguide />;
}

import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { site } from "@/lib/site";
import { introSeenScript } from "@/components/motion/intro-loader";
import { MotionProvider } from "@/components/motion/motion-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { StoreHydrator } from "@/components/layout/store-hydrator";
import { Toaster } from "@/components/ui/toaster";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Manrope is variable: one file covers 400–600.
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as (typeof routing.locales)[number], namespace: "meta" });
  return {
    metadataBase: new URL(site.url),
    title: { default: t("title"), template: "%s | Jela Fashion" },
    description: t("description"),
  };
}

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  colorScheme: "light",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    // The intro loader's inline script sets data attributes on <html> before hydration.
    <html lang={locale} className={`${cormorant.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <Script id="intro-seen" strategy="beforeInteractive">
          {introSeenScript}
        </Script>
      </head>
      <body>
        <NextIntlClientProvider>
          <MotionProvider>
            <a
              href="#main"
              className="sr-only-focusable fixed left-4 top-4 z-[80] bg-ink px-4 py-3 text-small text-ivory"
            >
              {t("skipToContent")}
            </a>
            <SiteHeader />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <SiteFooter />
            <Toaster />
            <StoreHydrator />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { cormorant, cormorantItalic, manrope } from "@/app/fonts";
import { site } from "@/lib/site";
import { introSeenScript } from "@/components/motion/intro-loader";
import { revealFallbackScript, revealNoScriptCss } from "@/components/motion/reveal-safety";
import { MotionProvider } from "@/components/motion/motion-provider";
import { CheckoutFooter } from "@/components/layout/checkout-chrome";
import { FooterSwitch, HeaderSwitch } from "@/components/layout/chrome-switch";
import { SiteFooter } from "@/components/layout/site-footer";
import { StoreHydrator } from "@/components/layout/store-hydrator";
import { NewsletterPopup } from "@/components/layout/newsletter-popup";
import { WhatsAppBubble } from "@/components/layout/whatsapp-bubble";
import { ConsentBanner } from "@/components/consent/consent-banner";
import { consentPendingScript } from "@/components/consent/pending-script";
import { TrackingScripts } from "@/components/tracking/tracking-scripts";
import { Toaster } from "@/components/ui/toaster";
import { NavCategoriesProvider } from "@/components/layout/nav-categories";
import { getCatalog, getMeasurementDefinitions } from "@/lib/catalog/repository";
import type { CategoryId } from "@/lib/catalog/types";


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
  // The measurements every dress asks for, for "Custom size" before a dress is chosen.
  const [definitions, catalog] = await Promise.all([getMeasurementDefinitions(), getCatalog()]);
  const coreMeasurements = definitions.filter((m) => m.alwaysRequired);
  // Categories without a published dress drop out of every menu until one is published.
  const emptyCategories = (["bridal", "evening", "short"] as const satisfies readonly CategoryId[]).filter(
    (id) => !catalog.some((p) => p.category === id),
  );

  return (
    // The intro loader's inline script sets data attributes on <html> before hydration.
    <html lang={locale} className={`${cormorant.variable} ${cormorantItalic.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Plain inline script, not next/script: it must run before first paint (next/script's
            beforeInteractive defers inline code until the Next runtime boots). */}
        <script dangerouslySetInnerHTML={{ __html: `${introSeenScript}${consentPendingScript}${revealFallbackScript}` }} />
        <noscript>
          <style>{revealNoScriptCss}</style>
        </noscript>
      </head>
      <body>
        <NextIntlClientProvider>
          <MotionProvider>
            <NavCategoriesProvider empty={emptyCategories}>
            <a
              href="#main"
              className="sr-only-focusable fixed left-4 top-4 z-[80] bg-ink px-4 py-3 text-small text-ivory"
            >
              {t("skipToContent")}
            </a>
            <HeaderSwitch />
            <main id="main" tabIndex={-1} className="outline-none">
              {children}
            </main>
            <FooterSwitch site={<SiteFooter emptyCategories={emptyCategories} />} focus={<CheckoutFooter />} />
            <WhatsAppBubble definitions={coreMeasurements} />
            <NewsletterPopup />
            <ConsentBanner />
            <Toaster />
            <StoreHydrator />
            <TrackingScripts />
            </NavCategoriesProvider>
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

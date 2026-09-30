import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { cormorant, manrope } from "@/app/fonts";
import { MotionFeatures } from "@/components/motion/motion-features";
import { Toaster } from "@/components/ui/toaster";

// The admin panel is the atelier's tool: Albanian only, never indexed, outside the shop's
// locale routing. Messages come from the default (sq) request config.
export const metadata: Metadata = {
  title: { default: "Paneli · Jela Fashion", template: "%s · Paneli · Jela Fashion" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sq" className={`${cormorant.variable} ${manrope.variable}`}>
      <body className="bg-ivory font-sans text-[0.875rem] text-ink [&_:is(h1,h2,h3,h4)]:font-sans">
        <NextIntlClientProvider locale="sq">
          <MotionFeatures>
            {children}
            <Toaster />
          </MotionFeatures>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/cn";

/** Both locales as plain links: one tap, crawlable, and the current one marked. */
export function LanguageSwitcher({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const t = useTranslations();
  const current = useLocale();
  const pathname = usePathname();
  const params = useParams();

  return (
    <nav aria-label={t("common.language")} className={cn("flex items-center", className)}>
      <ul className="flex items-center">
        {routing.locales.map((locale, i) => (
          <li key={locale} className="flex items-center">
            {i > 0 && <span aria-hidden className="mx-1 h-3 w-px bg-current opacity-40" />}
            <Link
              // Internal pathname + current params maps to the same page in the other locale.
              href={{ pathname, params } as unknown as Parameters<typeof Link>[0]["href"]}
              locale={locale}
              hrefLang={locale}
              lang={locale}
              aria-current={locale === current ? "true" : undefined}
              aria-label={t(`languages.${locale}`)}
              onClick={onNavigate}
              className={cn(
                "label flex min-h-11 min-w-11 items-center justify-center px-1",
                locale === current ? "underline decoration-champagne decoration-1 underline-offset-[6px]" : "opacity-70 hover:opacity-100",
              )}
            >
              {locale.toUpperCase()}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

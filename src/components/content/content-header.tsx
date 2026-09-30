import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";
import { RevealText } from "@/components/motion/reveal-text";
import { JsonLd } from "@/components/seo/json-ld";

/**
 * Opening of every content page: breadcrumb (visible and as BreadcrumbList), micro-label,
 * serif headline with the masked line reveal, and a lead paragraph. Left-aligned on the
 * asymmetric grid (MASTER: centred only for hero and final CTA).
 */
export async function ContentHeader({
  locale,
  crumbs,
  label,
  title,
  intro,
  children,
}: {
  locale: Locale;
  crumbs: Crumb[];
  label: string;
  title: string | string[];
  intro?: string;
  children?: ReactNode;
}) {
  const t = await getTranslations("pages");
  const all: Crumb[] = [{ name: t("home"), href: "/" }, ...crumbs];
  return (
    <header className="container-page pt-[calc(var(--header-h)+32px)] lg:pt-[calc(var(--header-h)+56px)]">
      <JsonLd data={breadcrumbJsonLd(locale, all)} />
      <nav aria-label={t("breadcrumb")}>
        <ol className="flex flex-wrap items-center gap-2 text-small text-stone">
          {all.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>/</span>}
              {i < all.length - 1 ? (
                <Link href={c.href} className="link-quiet">
                  {c.name}
                </Link>
              ) : (
                <span aria-current="page">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="grid gap-6 border-b border-hairline pb-12 pt-12 lg:grid-cols-12 lg:gap-6 lg:pb-20 lg:pt-20">
        <div className="lg:col-span-8">
          <p className="label text-stone">{label}</p>
          <RevealText as="h1" immediate lines={Array.isArray(title) ? title : [title]} className="mt-5 font-serif text-h1 font-light" />
          {intro && <p className="measure mt-8 font-serif text-lead text-stone">{intro}</p>}
        </div>
        {children && <div className="lg:col-span-4 lg:self-end">{children}</div>}
      </div>
    </header>
  );
}

import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";
import { Link, getPathname } from "@/i18n/navigation";
import type { Viewer } from "@/lib/account/types";
import type { Locale } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";

const SECTIONS = [
  { key: "orders", href: "/account" },
  { key: "addresses", href: "/account/addresses" },
  { key: "measurements", href: "/account/measurements" },
  { key: "profile", href: "/account/profile" },
] as const;

export type AccountSection = (typeof SECTIONS)[number]["key"];

export async function AccountShell({
  viewer,
  locale,
  active,
  children,
}: {
  viewer: Viewer;
  locale: Locale;
  active: AccountSection;
  children: ReactNode;
}) {
  const t = await getTranslations("account");
  const ta = await getTranslations("auth");
  const firstName = viewer.fullName?.split(" ")[0];

  return (
    <section className="container-page pb-24 pt-[calc(var(--header-h)+40px)] lg:pb-32 lg:pt-[calc(var(--header-h)+72px)]">
      <div className="flex flex-col gap-6 border-b border-hairline pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label text-stone">{t("title")}</p>
          <h1 className="mt-3 font-serif text-h1 font-light">{firstName ? t("greeting", { name: firstName }) : t("greetingAnon")}</h1>
          <p className="mt-2 text-small text-stone">{t("signedInAs", { email: viewer.email })}</p>
        </div>
        <form action={signOut}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="next" value={getPathname({ locale, href: "/" })} />
          <button type="submit" className="flex min-h-11 items-center text-small">
            <span className="link-underline">{ta("signOut")}</span>
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-6">
        <nav aria-label={t("title")} className="lg:col-span-3">
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <Link
                  href={s.href}
                  aria-current={active === s.key ? "page" : undefined}
                  className={cn(
                    "label relative flex min-h-11 items-center whitespace-nowrap px-3 tracking-[0.16em] lg:px-0",
                    active === s.key ? "text-ink" : "text-stone hover:text-ink",
                  )}
                >
                  {t(`nav.${s.key}`)}
                  {active === s.key && <span aria-hidden className="absolute inset-x-3 bottom-1.5 h-px bg-champagne lg:inset-x-0 lg:right-auto lg:w-8" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="lg:col-span-8 lg:col-start-5">{children}</div>
      </div>
    </section>
  );
}

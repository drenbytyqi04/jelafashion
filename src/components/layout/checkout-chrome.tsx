import { ArrowLeft, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CookieSettingsLink } from "@/components/consent/cookie-settings-link";

// Focus mode for checkout: the wordmark, a way back and a quiet promise of security.
// Nothing else competes with finishing the order.

export function CheckoutHeader() {
  const t = useTranslations();
  return (
    <header className="border-b border-hairline bg-ivory">
      <div className="container-page grid h-(--header-h) grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <Link href="/cart" className="-ml-3 flex min-h-11 items-center gap-2 px-3 text-small text-stone hover:text-ink">
          <ArrowLeft aria-hidden size={18} strokeWidth={1.25} />
          <span className="max-md:sr-only">{t("checkout.backToCart")}</span>
        </Link>
        <Link href="/" aria-label={t("common.home")} className="flex min-h-11 items-center">
          <span className="wordmark">Jela Fashion</span>
        </Link>
        <p className="flex items-center justify-end gap-2 text-small text-stone">
          <Lock aria-hidden size={16} strokeWidth={1.25} />
          <span className="max-md:sr-only">{t("checkout.secure")}</span>
        </p>
      </div>
    </header>
  );
}

export function CheckoutFooter() {
  const t = useTranslations("footer");
  const tc = useTranslations("consent");
  const links = [
    ["/shipping", t("shipping")],
    ["/returns", t("returns")],
    ["/privacy", t("privacy")],
    ["/terms", t("terms")],
  ] as const;
  return (
    <footer className="border-t border-hairline">
      <div className="container-page flex flex-col gap-2 py-6 md:flex-row md:items-center md:justify-between">
        <nav aria-label={t("legal")}>
          <ul className="flex flex-wrap gap-x-6">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="flex min-h-11 items-center text-small text-stone hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsLink label={tc("footerLink")} />
            </li>
          </ul>
        </nav>
        <p className="nums text-small text-stone">{t("rights", { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}

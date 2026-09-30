import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { StaticPathname } from "@/i18n/routing";
import { site, whatsappHref } from "@/lib/site";
import { Accordion } from "@/components/ui/accordion";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons/brand-icons";
import { LanguageSwitcher } from "./language-switcher";
import { NewsletterForm } from "./newsletter-form";
import { CookieSettingsLink } from "@/components/consent/cookie-settings-link";

type FooterLink = { label: string; href: StaticPathname } | { label: string; external: string; icon?: "instagram" | "whatsapp" };

export function SiteFooter() {
  const t = useTranslations();
  const wa = whatsappHref();

  const columns: { key: string; title: string; links: FooterLink[] }[] = [
    {
      key: "shop",
      title: t("footer.shop"),
      links: [
        { label: t("nav.bridal"), href: "/bridal" },
        { label: t("nav.evening"), href: "/evening" },
        { label: t("nav.short"), href: "/short" },
        { label: t("nav.newIn"), href: "/new-in" },
      ],
    },
    {
      key: "help",
      title: t("footer.help"),
      links: [
        { label: t("footer.sizeGuide"), href: "/size-guide" },
        { label: t("footer.madeToMeasure"), href: "/made-to-measure" },
        { label: t("footer.shipping"), href: "/shipping" },
        { label: t("footer.returns"), href: "/returns" },
        { label: t("footer.faq"), href: "/faq" },
        { label: t("footer.contact"), href: "/contact" },
      ],
    },
    {
      key: "atelier",
      title: t("footer.atelier"),
      links: [
        { label: t("footer.about"), href: "/atelier" },
        { label: t("common.instagram"), external: site.instagramUrl, icon: "instagram" },
        wa
          ? { label: t("common.whatsapp"), external: wa, icon: "whatsapp" }
          : { label: t("common.whatsapp"), href: "/contact" },
      ],
    },
  ];

  const payments = ["Visa", "Mastercard", t("footer.bankTransfer"), "Wise", "Western Union", "MoneyGram", "Ria"];

  const renderLinks = (links: FooterLink[]) => (
    <ul className="flex flex-col">
      {links.map((l) => (
        <li key={l.label}>
          {"external" in l ? (
            <a href={l.external} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-2 text-small lg:min-h-9">
              {l.icon === "instagram" && <InstagramIcon size={16} />}
              {l.icon === "whatsapp" && <WhatsAppIcon size={16} />}
              <span className="link-quiet">{l.label}</span>
            </a>
          ) : (
            <Link href={l.href} className="flex min-h-11 items-center text-small lg:min-h-9">
              <span className="link-quiet">{l.label}</span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="bg-linen text-ink">
      <div className="container-page grid gap-8 py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
        <div className="lg:col-span-5">
          <h2 className="font-serif text-h2">{t("newsletter.title")}</h2>
          <p className="mt-3 text-body text-stone">{t("newsletter.text")}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <NewsletterForm />
        </div>
      </div>

      <div className="container-page">
        <div aria-hidden className="h-px bg-champagne" />
      </div>

      <div className="container-page grid gap-10 py-14 lg:grid-cols-12 lg:gap-6 lg:py-20">
        <div className="lg:col-span-4">
          <Link href="/" aria-label={t("common.home")} className="inline-flex min-h-11 items-center">
            <span className="wordmark">Jela Fashion</span>
          </Link>
          <p className="mt-2 text-small text-stone">{t("footer.tagline")}</p>
        </div>

        {/* Mobile: collapsible columns */}
        <Accordion
          className="lg:hidden"
          type="multiple"
          headingLevel={2}
          items={columns.map((c) => ({ value: c.key, title: c.title, content: renderLinks(c.links) }))}
        />

        {/* Desktop: open columns */}
        <div className="hidden lg:col-span-7 lg:col-start-6 lg:grid lg:grid-cols-3 lg:gap-6">
          {columns.map((c) => (
            <nav key={c.key} aria-labelledby={`footer-${c.key}`}>
              <h2 id={`footer-${c.key}`} className="label mb-4 font-sans text-stone">
                {c.title}
              </h2>
              {renderLinks(c.links)}
            </nav>
          ))}
        </div>
      </div>

      <div className="container-page border-t border-hairline py-8">
        <h2 className="sr-only">{t("footer.paymentMethods")}</h2>
        <ul className="flex flex-wrap gap-2" aria-label={t("footer.paymentMethods")}>
          {payments.map((p) => (
            <li key={p} className="border border-hairline px-3 py-1.5 text-[0.75rem] text-stone">
              {p}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <nav aria-label={t("footer.legal")}>
            <ul className="flex flex-wrap gap-x-6">
              {(
                [
                  ["/privacy", t("footer.privacy")],
                  ["/terms", t("footer.terms")],
                  ["/cookies", t("footer.cookies")],
                ] as const
              ).map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="flex min-h-11 items-center text-small text-stone hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsLink label={t("consent.footerLink")} />
              </li>
            </ul>
          </nav>
          <div className="flex items-center justify-between gap-6 lg:justify-end">
            <LanguageSwitcher className="-ml-1" />
            <p className="nums text-small text-stone">{t("footer.rights", { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

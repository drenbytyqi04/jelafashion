import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { whatsappHref } from "@/lib/site";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { ContentHeader } from "@/components/content/content-header";
import { JsonLd } from "@/components/seo/json-ld";

type Props = { params: Promise<{ locale: string }> };
type Group = { title: string; items: { q: string; a: string }[] };

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.faq" });
  return pageMetadata({ locale, href: "/faq", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function FaqPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.faq");
  const tc = await getTranslations("homeSections");
  const groups = t.raw("groups") as Group[];
  const wa = whatsappHref();
  // Placeholder answers aren't published as structured data.
  const answered = groups.flatMap((g) => g.items).filter((i) => !/^\[.*\]$/.test(i.a));

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: answered.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
        }}
      />
      <ContentHeader locale={locale} crumbs={[{ name: t("metaTitle"), href: "/faq" }]} label={t("label")} title={t("title")} intro={t("intro")} />
      <div className="container-page pb-16 lg:pb-24">
        {groups.map((g) => (
          <section key={g.title} className="grid gap-4 border-b border-hairline py-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
            <h2 className="font-serif text-h3 lg:col-span-4">{g.title}</h2>
            <Accordion
              className="lg:col-span-7 lg:col-start-6"
              headingLevel={3}
              items={g.items.map((item, i) => ({ value: `${g.title}-${i}`, title: item.q, content: <p className="measure text-body text-ink/85">{item.a}</p> }))}
            />
          </section>
        ))}
        <section className="grid gap-6 py-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
          <h2 className="font-serif text-h3 lg:col-span-4">{t("moreTitle")}</h2>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-7 lg:col-start-6">
            <Button asChild>
              <Link href="/contact">{t("moreCta")}</Link>
            </Button>
            {wa && (
              <Button asChild variant="secondary">
                <a href={wa} target="_blank" rel="noopener">
                  <WhatsAppIcon size={18} />
                  {tc("consultWhatsapp")}
                </a>
              </Button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

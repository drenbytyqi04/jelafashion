import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { getShippingZones } from "@/lib/commerce/config";
import { countryName } from "@/lib/commerce/present";
import { formatPrice } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ContentHeader } from "@/components/content/content-header";
import { ProseSections, type ProseSection } from "@/components/content/prose-sections";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.shipping" });
  return pageMetadata({ locale, href: "/shipping", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function ShippingPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.shipping");
  const tf = await getTranslations("pages.faq");
  const zones = await getShippingZones();
  const price = (c: number) => formatPrice(c, locale);

  return (
    <>
      <ContentHeader locale={locale} crumbs={[{ name: t("metaTitle"), href: "/shipping" }]} label={t("label")} title={t("title")} intro={t("intro")} />
      <div className="container-page py-12 lg:py-16">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("metaTitle")}>
          <table className="w-full min-w-[34rem] border-collapse text-small">
            <thead>
              <tr className="border-b border-ink text-left">
                <th scope="col" className="label py-3 pr-4 font-medium">{t("zone")}</th>
                <th scope="col" className="label py-3 pr-4 font-medium">{t("method")}</th>
                <th scope="col" className="label py-3 pr-4 font-medium">{t("time")}</th>
                <th scope="col" className="label py-3 text-right font-medium">{t("price")}</th>
              </tr>
            </thead>
            <tbody>
              {zones.flatMap((z) =>
                z.rates.map((r, i) => (
                  <tr key={r.id} className="border-b border-hairline align-top">
                    {i === 0 && (
                      <th scope="rowgroup" rowSpan={z.rates.length} className="py-4 pr-4 text-left font-normal">
                        <span className="block font-serif text-[1.25rem] leading-tight">{pick(z.name, locale)}</span>
                        <span className="measure mt-1 block text-stone">
                          {z.isFallback ? t("restOfWorld") : z.countries.map((c) => countryName(c, locale)).join(", ")}
                        </span>
                      </th>
                    )}
                    <td className="py-4 pr-4">{pick(r.name, locale)}</td>
                    <td className="nums py-4 pr-4 text-stone">{t("days", { min: r.minDays, max: r.maxDays })}</td>
                    <td className="nums py-4 text-right">
                      {r.priceCents === 0 ? t("free") : price(r.priceCents)}
                      {r.freeOverCents !== null && <span className="block text-stone">{t("freeOver", { amount: price(r.freeOverCents) })}</span>}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ProseSections
        sections={t.raw("sections") as ProseSection[]}
        footer={
          <Button asChild variant="secondary">
            <Link href="/contact">{tf("moreCta")}</Link>
          </Button>
        }
        className="pb-16 lg:pb-24"
      />
    </>
  );
}

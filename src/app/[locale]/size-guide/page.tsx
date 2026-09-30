import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ContentHeader } from "@/components/content/content-header";
import { SizeChart } from "@/components/product/size-chart";
import { MeasurementIllustration } from "@/components/wizard/figures";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.sizeGuide" });
  return pageMetadata({ locale, href: "/size-guide", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function SizeGuidePage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.sizeGuide");
  const ts = await getTranslations("sizeGuide");
  const how = [
    { key: "bust", id: "bust" },
    { key: "waist", id: "waist" },
    { key: "hips", id: "hips" },
  ] as const;

  return (
    <>
      <ContentHeader locale={locale} crumbs={[{ name: t("metaTitle"), href: "/size-guide" }]} label={t("label")} title={ts("title")} intro={ts("text")} />
      <div className="container-page grid gap-16 py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
        <SizeChart className="lg:col-span-7" />
        <aside className="bg-linen p-6 lg:col-span-4 lg:col-start-9 lg:self-start lg:p-8">
          <h2 className="font-serif text-h3">{t("customTitle")}</h2>
          <p className="mt-4 text-body text-stone">{t("customText")}</p>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/made-to-measure">{t("customCta")}</Link>
          </Button>
        </aside>
      </div>
      <section aria-labelledby="how-to" className="border-t border-hairline">
        <div className="container-page py-16 lg:py-24">
          <h2 id="how-to" className="font-serif text-h2">
            {t("howToTitle")}
          </h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
            {how.map((h) => (
              <li key={h.key}>
                <div className="bg-linen px-6 py-6">
                  <MeasurementIllustration view="front" measurementId={h.id} className="mx-auto aspect-[1/2] h-56 w-auto" />
                </div>
                <h3 className="mt-5 text-body font-medium">{ts(h.key)}</h3>
                <p className="mt-1 text-small text-stone">{ts(`howTo${h.key[0].toUpperCase()}${h.key.slice(1)}` as "howToBust")}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

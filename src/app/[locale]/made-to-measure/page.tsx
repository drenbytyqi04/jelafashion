import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getMeasurementDefinitions } from "@/lib/catalog/repository";
import type { Locale, MeasurementDefinition } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ContentHeader } from "@/components/content/content-header";
import { Consultation } from "@/components/home/consultation";
import { MeasurementIllustration } from "@/components/wizard/figures";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.madeToMeasure" });
  return pageMetadata({ locale, href: "/made-to-measure", title: t("metaTitle"), description: t("metaDescription") });
}

function MeasureGrid({ defs, locale }: { defs: MeasurementDefinition[]; locale: Locale }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {defs.map((d) => (
        <li key={d.id}>
          <div className="bg-linen px-6 py-4">
            <MeasurementIllustration view={d.view} measurementId={d.id} className="mx-auto aspect-[1/2] h-40 w-auto md:h-48" />
          </div>
          <h4 className="mt-4 text-body font-medium">{pick(d.label, locale)}</h4>
          <p className="mt-1 text-small text-stone">{pick(d.hint, locale)}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function MadeToMeasurePage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.madeToMeasure");
  const th = await getTranslations("homeSections");
  const steps = th.raw("mtmSteps") as { title: string; text: string }[];
  const defs = await getMeasurementDefinitions();

  return (
    <>
      <ContentHeader locale={locale} crumbs={[{ name: t("label"), href: "/made-to-measure" }]} label={t("label")} title={t.raw("title") as string[]} intro={t("intro")}>
        <div className="flex flex-col gap-3">
          <Button asChild magnetic>
            <Link href="/shop">{t("cta")}</Link>
          </Button>
          <Button asChild variant="text" className="self-start">
            <Link href="/size-guide">{t("sizeGuideCta")}</Link>
          </Button>
        </div>
      </ContentHeader>

      <section aria-labelledby="mtm-steps" className="container-page py-16 lg:py-24">
        <h2 id="mtm-steps" className="label text-stone">
          {t("stepsTitle")}
        </h2>
        <ol className="mt-10 grid gap-12 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="border-t border-champagne pt-6">
              <span className="nums font-serif text-h3 text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 font-serif text-h3">{s.title}</h3>
              <p className="measure mt-3 text-body text-stone">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="mtm-measures" className="border-t border-hairline">
        <div className="container-page grid gap-6 py-16 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-5">
            <h2 id="mtm-measures" className="font-serif text-h2">
              {t("measureTitle")}
            </h2>
            <p className="measure mt-6 text-body text-stone">{t("measureText")}</p>
          </div>
        </div>
        <div className="container-page pb-16 lg:pb-24">
          <h3 className="label mb-8 text-stone">{t("alwaysTitle")}</h3>
          <MeasureGrid defs={defs.filter((d) => d.alwaysRequired)} locale={locale} />
          <h3 className="label mb-3 mt-16 text-stone">{t("extraTitle")}</h3>
          <p className="measure mb-8 text-small text-stone">{t("extraText")}</p>
          <MeasureGrid defs={defs.filter((d) => !d.alwaysRequired)} locale={locale} />
        </div>
      </section>

      <section className="border-t border-hairline">
        <div className="container-page grid gap-12 py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
          <div className="lg:col-span-5">
            <h2 className="font-serif text-h3">{t("tipsTitle")}</h2>
            <ul className="mt-6 flex flex-col gap-3">
              {(t.raw("tips") as string[]).map((tip) => (
                <li key={tip} className="flex gap-3 text-body">
                  <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-champagne" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <h2 className="font-serif text-h3">{t("timeTitle")}</h2>
            <p className="measure mt-6 text-body text-stone">{t("timeText")}</p>
          </div>
        </div>
      </section>

      <Consultation />
    </>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { ContentHeader } from "@/components/content/content-header";
import { InstagramGrid } from "@/components/home/instagram-grid";
import { Parallax } from "@/components/motion/parallax";
import { RevealImage } from "@/components/motion/reveal-image";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.atelier" });
  return pageMetadata({ locale, href: "/atelier", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function AtelierPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.atelier");
  const chapters = t.raw("chapters") as { title: string; text: string }[];
  const facts = t.raw("facts") as { label: string; value: string }[];

  return (
    <>
      <ContentHeader locale={locale} crumbs={[{ name: t("metaTitle"), href: "/atelier" }]} label={t("label")} title={t.raw("title") as string[]} intro={t("intro")} />

      {/* The page's one overlapping composition (MASTER): offset one column and 96px. */}
      <section className="container-page grid grid-cols-4 gap-4 py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
        <div className="col-span-3 lg:col-span-6">
          <RevealImage>
            <Parallax amount={6}>
              <ImagePlaceholder ratio="3/4" tint="#E6DCCD" />
            </Parallax>
          </RevealImage>
        </div>
        <div className="col-span-2 col-start-3 -mt-24 lg:col-span-4 lg:col-start-6 lg:mt-24">
          <RevealImage>
            <ImagePlaceholder ratio="3/4" tone="blush" />
          </RevealImage>
        </div>
      </section>

      <section className="container-page pb-16 lg:pb-24">
        {chapters.map((c, i) => (
          <article key={c.title} className="grid gap-4 border-t border-hairline py-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
            <span className="nums label text-gold-ink lg:col-span-1">{String(i + 1).padStart(2, "0")}</span>
            <h2 className="font-serif text-h2 lg:col-span-4">{c.title}</h2>
            <p className="measure font-serif text-lead text-stone lg:col-span-6 lg:col-start-7">{c.text}</p>
          </article>
        ))}
      </section>

      <section className="bg-linen">
        <div className="container-page grid gap-12 py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
          <div className="lg:col-span-5">
            <h2 className="label text-stone">{t("factsTitle")}</h2>
            <dl className="mt-8 flex flex-col">
              {facts.map((f) => (
                <div key={f.label} className="grid grid-cols-[8rem_1fr] gap-4 border-b border-hairline py-4">
                  <dt className="text-small text-stone">{f.label}</dt>
                  <dd className="text-body">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="lg:col-span-6 lg:col-start-7 lg:self-center">
            <blockquote className="font-serif text-h2 font-light leading-tight">“{t("quote")}”</blockquote>
            <figcaption className="label mt-6 text-stone">{t("quoteBy")}</figcaption>
          </figure>
        </div>
      </section>

      <InstagramGrid />

      <section className="container-page pb-24 text-center lg:pb-32">
        <h2 className="font-serif text-h2">{t("ctaTitle")}</h2>
        <p className="measure mx-auto mt-5 text-body text-stone">{t("ctaText")}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild magnetic>
            <Link href="/contact">{t("ctaContact")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/shop">{t("ctaShop")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

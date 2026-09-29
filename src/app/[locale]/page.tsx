import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategories, getHeroContent, getNewIn, getTestimonials } from "@/lib/catalog/repository";
import type { Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { Button } from "@/components/ui/button";
import { IntroLoader } from "@/components/motion/intro-loader";
import { Marquee } from "@/components/motion/marquee";
import { RevealText } from "@/components/motion/reveal-text";
import { AtelierStory } from "@/components/home/atelier-story";
import { BridalFeature } from "@/components/home/bridal-feature";
import { CategoryTiles } from "@/components/home/category-tiles";
import { Consultation } from "@/components/home/consultation";
import { FinalCta } from "@/components/home/final-cta";
import { HeroMedia } from "@/components/home/hero-media";
import { InstagramGrid } from "@/components/home/instagram-grid";
import { Lookbook } from "@/components/home/lookbook";
import { MadeToMeasure } from "@/components/home/made-to-measure";
import { NewInCarousel } from "@/components/home/new-in-carousel";
import { Testimonials } from "@/components/home/testimonials";

// Prerendered, refreshed at most every 5 minutes (and on demand via the catalog tag).
export const revalidate = 300;

// Sections follow design-system/jela-fashion/pages/home.md:
// DESIRE (hero, marquee, categories) → COLLECTION (new in, bridal) → PERFECT FIT (made to
// measure) → TRUST (lookbook, atelier, testimonials, consultation) → ORDER (instagram, CTA).
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const [hero, categories, newIn, testimonials] = await Promise.all([
    getHeroContent(),
    getCategories(),
    getNewIn(8),
    getTestimonials(),
  ]);
  const marquee = t.raw("marquee") as string[];

  return (
    <>
      <IntroLoader />
      <section className="hero on-image relative flex min-h-svh items-end overflow-hidden bg-stone text-white">
        <div className="absolute inset-0">
          <HeroMedia videoUrl={hero.videoUrl} posterUrl={hero.posterUrl} />
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-ink/55 to-transparent" />

        <div className="container-page relative pb-[max(3rem,env(safe-area-inset-bottom))] lg:pb-20">
          <div className="lg:mx-auto lg:max-w-4xl lg:text-center">
            <p className="hero-fade label" style={{ animationDelay: "calc(var(--intro-delay) + 0.1s)" }}>
              {t("heroLabel")}
            </p>
            <RevealText
              as="h1"
              immediate
              delay={0.2}
              lines={hero.headline[locale] ?? hero.headline.sq}
              className="mt-5 font-serif text-display font-light"
            />
            <p
              className="hero-fade measure mt-6 text-body text-white/90 lg:mx-auto lg:font-serif lg:text-lead"
              style={{ animationDelay: "calc(var(--intro-delay) + 0.6s)" }}
            >
              {pick(hero.subtitle, locale)}
            </p>
            <div
              className="hero-fade mt-10 flex flex-col gap-3 md:flex-row lg:justify-center"
              style={{ animationDelay: "calc(var(--intro-delay) + 0.75s)" }}
            >
              <Button asChild magnetic block>
                <Link href="/shop">{t("ctaShop")}</Link>
              </Button>
              <Button asChild variant="on-image" magnetic block>
                <Link href="/made-to-measure">{t("ctaMeasure")}</Link>
              </Button>
            </div>
          </div>
          <div aria-hidden className="mt-12 hidden flex-col items-center gap-3 lg:flex">
            <span className="label text-white/80">{t("scroll")}</span>
            <span className="scroll-line block h-14 w-px origin-top bg-champagne" />
          </div>
        </div>
      </section>

      <Marquee items={marquee} className="bg-ivory" />
      <CategoryTiles categories={categories} locale={locale} />
      <NewInCarousel products={newIn} />
      <BridalFeature />
      <div className="pt-24 lg:pt-40">
        <MadeToMeasure />
      </div>
      <Lookbook />
      <AtelierStory />
      <Testimonials items={testimonials} />
      <Consultation />
      <InstagramGrid />
      <FinalCta />
    </>
  );
}

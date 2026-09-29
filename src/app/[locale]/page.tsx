import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { IntroLoader } from "@/components/motion/intro-loader";
import { Marquee } from "@/components/motion/marquee";
import { RevealText } from "@/components/motion/reveal-text";

// Phase 1: hero and marquee only, to exercise the transparent header, intro loader and
// motion primitives. Phase 2 builds the remaining home sections from pages/home.md.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale as "sq" | "en");
  const t = await getTranslations("home");
  const title = t.raw("heroTitle") as string[];
  const marquee = t.raw("marquee") as string[];

  return (
    <>
      <IntroLoader />
      <section className="hero relative flex min-h-svh items-end overflow-hidden bg-stone text-white">
        {/* Video slot: replaced by the admin-managed hero video in Phase 2 */}
        <div className="absolute inset-0" aria-hidden>
          <ImagePlaceholder ratio="9/16" tone="stone" className="h-full !aspect-auto opacity-60" />
        </div>
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-ink/55 to-transparent" />

        <div className="container-page relative pb-[max(3rem,env(safe-area-inset-bottom))] lg:pb-24">
          <div className="lg:mx-auto lg:max-w-4xl lg:text-center">
            <p className="hero-fade label" style={{ animationDelay: "calc(var(--intro-delay) + 0.1s)" }}>
              {t("heroLabel")}
            </p>
            <RevealText
              as="h1"
              immediate
              delay={0.2}
              lines={title}
              className="mt-5 font-serif text-display font-light"
            />
            <p
              className="hero-fade measure mt-6 text-body text-white/90 lg:mx-auto lg:text-lead lg:font-serif"
              style={{ animationDelay: "calc(var(--intro-delay) + 0.6s)" }}
            >
              {t("heroSubtitle")}
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

      <section className="section container-page">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-6">
          <ImagePlaceholder ratio="3/4" tone="linen" />
          <ImagePlaceholder ratio="3/4" tone="blush" className="lg:mt-24" />
          <ImagePlaceholder ratio="3/4" tone="stone" className="hidden lg:block" />
        </div>
      </section>
    </>
  );
}

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { siteImages } from "@/lib/site-images";
import { Parallax } from "@/components/motion/parallax";
import { RevealImage } from "@/components/motion/reveal-image";
import { RevealText } from "@/components/motion/reveal-text";

export async function AtelierStory() {
  const t = await getTranslations("homeSections");
  return (
    <section aria-labelledby="atelier-title" className="section">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="relative mb-16 pl-[12%] lg:order-2 lg:col-span-7 lg:col-start-6 lg:mb-0 lg:pl-0">
          <RevealImage>
            <Parallax amount={8}>
              <ImagePlaceholder ratio="4/5" tint="#E6DCCD" src={siteImages.atelierStory} sizes="(min-width: 1024px) 45vw, 90vw" />
            </Parallax>
          </RevealImage>
          {/* A detail crossing the frame's lower left edge: the hand-finished close-up. */}
          <div className="absolute -bottom-16 left-0 w-[42%] border-[6px] border-ivory lg:-bottom-20 lg:-left-[14%] lg:w-[36%] lg:border-8">
            <RevealImage>
              <ImagePlaceholder ratio="3/4" tint="#D9CDBB" pose="back" src={siteImages.atelierDetail} sizes="(min-width: 1024px) 20vw, 40vw" />
            </RevealImage>
          </div>
        </div>
        <div className="lg:order-1 lg:col-span-4">
          <p className="label mb-6 text-gold-ink">{t("atelierLabel")}</p>
          <RevealText as="h2" id="atelier-title" lines={[t("atelierTitle")]} className="font-serif text-h2" />
          <p className="measure mt-6 font-serif text-lead text-stone">{t("atelierText")}</p>
          <Button asChild variant="text" className="mt-8">
            <Link href="/atelier">{t("atelierCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

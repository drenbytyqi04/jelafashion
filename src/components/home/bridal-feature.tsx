import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Parallax } from "@/components/motion/parallax";
import { RevealImage } from "@/components/motion/reveal-image";
import { RevealText } from "@/components/motion/reveal-text";

/** The page's one overlapping composition: large image, a second one crossing its edge. */
export async function BridalFeature() {
  const t = await getTranslations("homeSections");
  return (
    <section aria-labelledby="bridal-title" className="section bg-linen">
      <div className="container-page grid grid-cols-12 gap-x-3 lg:gap-x-6">
        <div className="relative col-span-11 lg:col-span-7">
          <RevealImage>
            <Parallax amount={6}>
              <ImagePlaceholder ratio="3/4" tint="#B8AA98" />
            </Parallax>
          </RevealImage>
          <div className="absolute -bottom-16 right-[-9%] w-[46%] border-[6px] border-linen lg:-bottom-24 lg:right-[-22%] lg:w-[44%] lg:border-8">
            <RevealImage>
              <ImagePlaceholder ratio="3/4" tint="#E2D3BF" pose="back" />
            </RevealImage>
          </div>
        </div>
        <div className="col-span-12 mt-28 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:self-center">
          <RevealText as="h2" id="bridal-title" lines={t.raw("bridalTitle") as string[]} className="font-serif text-h2" />
          <p className="measure mt-6 font-serif text-lead text-stone">{t("bridalText")}</p>
          <Button asChild variant="secondary" className="mt-10">
            <Link href="/bridal">{t("bridalCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

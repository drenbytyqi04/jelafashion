import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { Parallax } from "@/components/motion/parallax";
import { RevealImage } from "@/components/motion/reveal-image";
import { RevealText } from "@/components/motion/reveal-text";

export async function AtelierStory() {
  const t = await getTranslations("homeSections");
  return (
    <section aria-labelledby="atelier-title" className="section">
      <div className="container-page grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="lg:order-2 lg:col-span-7 lg:col-start-6">
          <RevealImage>
            <Parallax amount={8}>
              <ImagePlaceholder ratio="4/5" tint="#E6DCCD" />
            </Parallax>
          </RevealImage>
        </div>
        <div className="lg:order-1 lg:col-span-4">
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

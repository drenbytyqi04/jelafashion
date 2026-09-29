import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { RevealText } from "@/components/motion/reveal-text";

export async function FinalCta() {
  const t = await getTranslations("homeSections");
  return (
    <section aria-labelledby="final-title" className="on-image relative flex min-h-[80svh] items-center justify-center overflow-hidden text-white">
      <div aria-hidden className="absolute inset-0">
        <ImagePlaceholder ratio="16/9" tint="#4A433E" className="h-full !aspect-auto" />
      </div>
      <div aria-hidden className="absolute inset-0 bg-ink/35" />
      <div className="container-page relative text-center">
        <RevealText as="h2" id="final-title" lines={t.raw("finalTitle") as string[]} className="font-serif text-display font-light" />
        <Button asChild magnetic className="mt-10">
          <Link href="/shop">{t("finalCta")}</Link>
        </Button>
      </div>
    </section>
  );
}

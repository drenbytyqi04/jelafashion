import { Ruler, Scissors } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { DressIcon } from "@/components/icons/brand-icons";
import { RevealText } from "@/components/motion/reveal-text";
import { TapeDivider } from "./tape-divider";
import { TapeLine } from "./tape-line";

/** The key trust section. Numbered because the steps really are a sequence. */
export async function MadeToMeasure() {
  const t = await getTranslations("homeSections");
  const steps = t.raw("mtmSteps") as { title: string; text: string }[];
  const icons = [DressIcon, Ruler, Scissors];

  return (
    <section aria-labelledby="mtm-title" className="pb-24 lg:pb-40">
      <TapeDivider className="container-page" />
      <div className="container-page grid gap-12 pt-20 lg:grid-cols-12 lg:gap-6 lg:pt-32">
        <div className="lg:col-span-5">
          <RevealText as="h2" id="mtm-title" lines={t.raw("mtmTitle") as string[]} className="font-serif text-h2" />
          <p className="measure mt-6 text-body text-stone">{t("mtmText")}</p>
          <Button asChild magnetic className="mt-10 hidden lg:inline-flex">
            <Link href="/made-to-measure">{t("mtmCta")}</Link>
          </Button>
        </div>
        <div className="relative lg:col-span-6 lg:col-start-7">
          <TapeLine />
          <ol className="flex flex-col gap-12 pl-10 lg:gap-16 lg:pl-16">
            {steps.map((step, i) => {
              const Icon = icons[i];
              return (
                <li key={step.title} className="relative">
                  <span aria-hidden className="absolute -left-10 top-1 flex size-[9px] -translate-x-1/2 items-center justify-center lg:-left-16">
                    <span className="size-[9px] rounded-full border border-champagne bg-ivory" />
                  </span>
                  <div className="flex items-baseline gap-4">
                    <span className="nums label text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
                    <Icon aria-hidden size={22} strokeWidth={1.25} />
                  </div>
                  <h3 className="mt-4 font-serif text-h3">{step.title}</h3>
                  <p className="measure mt-2 text-body text-stone">{step.text}</p>
                </li>
              );
            })}
          </ol>
          <Button asChild block className="mt-12 lg:hidden">
            <Link href="/made-to-measure">{t("mtmCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { Locale, Testimonial } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { duration, ease } from "@/lib/motion";

/** One quote at a time, moved only by the visitor (no autoplay). */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const t = useTranslations("homeSections");
  const locale = useLocale() as Locale;
  const [index, setIndex] = useState(0);
  if (items.length === 0) return null;
  const item = items[index];
  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + items.length) % items.length);

  return (
    <section
      aria-labelledby="testimonials-title"
      aria-roledescription="carousel"
      className="section bg-linen"
    >
      <div className="container-page lg:grid lg:grid-cols-12 lg:gap-6">
        <h2 id="testimonials-title" className="label text-stone lg:col-span-2">
          {t("testimonialsTitle")}
        </h2>
        <div className="mt-8 lg:col-span-8 lg:col-start-3 lg:mt-0">
          <div
            aria-live="polite"
            aria-roledescription="slide"
            aria-label={t("testimonialOf", { current: index + 1, total: items.length })}
            className="grid min-h-[14rem] lg:min-h-[16rem]"
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.figure
                key={item.id}
                className="[grid-area:1/1]"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: duration.ui, ease: ease.couture }}
              >
                <blockquote className="font-serif-italic text-[clamp(1.75rem,1.4rem+1.5vw,2.75rem)] font-light italic leading-snug">
                  “{pick(item.quote, locale)}”
                </blockquote>
                <figcaption className="mt-6 text-small text-stone">
                  {item.author}
                  {item.location && <>, {item.location}</>}
                </figcaption>
              </m.figure>
            </AnimatePresence>
          </div>
          {items.length > 1 && (
            <div className="mt-10 flex items-center gap-4">
              <button type="button" onClick={() => go(-1)} aria-label={t("previous")} className="flex size-11 items-center justify-center border border-field hover:border-ink">
                <ChevronLeft aria-hidden size={18} strokeWidth={1.25} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={t("next")} className="flex size-11 items-center justify-center border border-field hover:border-ink">
                <ChevronRight aria-hidden size={18} strokeWidth={1.25} />
              </button>
              <p aria-hidden className="nums ml-2 text-small text-stone">
                {index + 1} / {items.length}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

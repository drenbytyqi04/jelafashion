"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import type { CatalogProduct } from "@/lib/catalog/types";
import { ProductCard } from "@/components/product/product-card";
import { RevealText } from "@/components/motion/reveal-text";

export function NewInCarousel({ products }: { products: CatalogProduct[] }) {
  const t = useTranslations("homeSections");
  const track = useRef<HTMLUListElement>(null);

  function scroll(dir: 1 | -1) {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby="new-in-title" className="pb-24 lg:pb-40">
      <div className="container-page mb-10 flex items-end justify-between gap-6">
        <RevealText as="h2" id="new-in-title" lines={[t("newInTitle")]} className="font-serif text-h2" />
        <div className="flex items-center gap-2">
          <div className="hidden items-center lg:flex">
            <button type="button" onClick={() => scroll(-1)} aria-label={t("previous")} className="flex size-11 items-center justify-center">
              <ChevronLeft aria-hidden size={20} strokeWidth={1.25} />
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label={t("next")} className="flex size-11 items-center justify-center">
              <ChevronRight aria-hidden size={20} strokeWidth={1.25} />
            </button>
          </div>
          <Link href="/new-in" className="label flex min-h-11 items-center">
            <span className="link-underline">{t("viewAll")}</span>
          </Link>
        </div>
      </div>
      <ul
        ref={track}
        data-lenis-prevent-horizontal
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-(--gutter) px-(--gutter) pb-2 [scrollbar-width:none] lg:gap-6"
      >
        {products.map((p) => (
          <li key={p.id} className="w-[62%] shrink-0 snap-start md:w-[38%] lg:w-[calc((100%-3*24px)/4.3)]">
            <ProductCard product={p} sizes="(min-width: 1024px) 23vw, 62vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}

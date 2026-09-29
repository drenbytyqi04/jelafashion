"use client";

import { Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { CatalogProduct, Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { ProductMedia } from "./product-media";
import { ProductLightbox } from "./product-lightbox";

/** Frames shown until photos exist: front and back in the first colour, then the others. */
function frameCount(product: CatalogProduct) {
  return product.images.length || Math.max(2, Math.min(4, product.colors.length * 2));
}

export function ProductGallery({ product, locale }: { product: CatalogProduct; locale: Locale }) {
  const t = useTranslations("product");
  const name = pick(product.name, locale);
  const count = frameCount(product);
  const [active, setActive] = useState(0);
  const [zoomAt, setZoomAt] = useState<number | null>(null);
  const track = useRef<HTMLUListElement>(null);

  function onScroll() {
    const el = track.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  const frames = Array.from({ length: count }, (_, i) => i);

  return (
    <div>
      {/* Mobile: swipe, with a champagne progress rule instead of dots */}
      <div className="relative md:hidden">
        <ul
          ref={track}
          onScroll={onScroll}
          data-lenis-prevent-horizontal
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          aria-label={name}
        >
          {frames.map((i) => (
            <li key={i} className="w-full shrink-0 snap-center" aria-label={t("galleryImage", { name, n: i + 1, total: count })}>
              <button type="button" onClick={() => setZoomAt(i)} className="block w-full" aria-label={t("openZoom", { n: i + 1 })}>
                <div data-product-image={i === 0 ? "" : undefined}>
                  <ProductMedia product={product} locale={locale} index={i} sizes="100vw" priority={i === 0} />
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div aria-hidden className="mx-(--gutter) mt-3 h-px bg-hairline">
          <span
            className="block h-full bg-champagne transition-transform duration-(--duration-ui) ease-(--ease-couture)"
            style={{ width: `${100 / count}%`, transform: `translateX(${active * 100}%)` }}
          />
        </div>
      </div>

      {/* Desktop: a vertical stack of large frames */}
      <ul className="hidden flex-col gap-3 md:flex">
        {frames.map((i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setZoomAt(i)}
              className="group relative block w-full cursor-zoom-in"
              aria-label={t("openZoom", { n: i + 1 })}
            >
              <div data-product-image-desktop={i === 0 ? "" : undefined}>
                <ProductMedia product={product} locale={locale} index={i} sizes="(min-width: 1024px) 55vw, 100vw" priority={i === 0} />
              </div>
              <span className="absolute bottom-4 right-4 flex size-11 items-center justify-center bg-ivory/90 opacity-0 transition-opacity duration-(--duration-ui) group-hover:opacity-100 group-focus-visible:opacity-100">
                <Maximize2 aria-hidden size={18} strokeWidth={1.25} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <ProductLightbox
        product={product}
        locale={locale}
        count={count}
        index={zoomAt}
        onIndexChange={setZoomAt}
      />
    </div>
  );
}

import type { CatalogProduct } from "@/lib/catalog/types";
import { ProductCard } from "./product-card";

/** A swipeable row of product cards (mobile), 4-up grid (desktop). */
export function ProductRail({ title, products, id }: { title: string; products: CatalogProduct[]; id: string }) {
  if (products.length === 0) return null;
  return (
    <section aria-labelledby={id} className="pt-24 lg:pt-32">
      <h2 id={id} className="container-page mb-8 font-serif text-h2">
        {title}
      </h2>
      <ul
        data-lenis-prevent-horizontal
        className="flex snap-x snap-mandatory scroll-px-(--gutter) gap-3 overflow-x-auto px-(--gutter) pb-2 [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible"
      >
        {products.map((p) => (
          <li key={p.id} className="w-[62%] shrink-0 snap-start md:w-[38%] lg:w-auto">
            <ProductCard product={p} sizes="(min-width: 1024px) 23vw, 62vw" />
          </li>
        ))}
      </ul>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import type { CatalogProduct } from "@/lib/catalog/types";
import { useWishlistStore } from "@/stores/wishlist";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/product-card";

const useHydrated = () =>
  useSyncExternalStore(
    (cb) => useWishlistStore.persist.onFinishHydration(cb),
    () => useWishlistStore.persist.hasHydrated(),
    () => false,
  );

export function WishlistView({ products }: { products: CatalogProduct[] }) {
  const t = useTranslations("pages.wishlist");
  const tc = useTranslations("cart");
  const hydrated = useHydrated();
  const ids = useWishlistStore((s) => s.productIds);
  // Saved dresses that were unpublished meanwhile simply drop out.
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is CatalogProduct => Boolean(p));

  return (
    <section className="container-page pb-24 pt-[calc(var(--header-h)+40px)] lg:pb-32 lg:pt-[calc(var(--header-h)+64px)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-6">
        <h1 className="font-serif text-h1 font-light">{t("title")}</h1>
        {hydrated && saved.length > 0 && <p className="nums text-small text-stone">{t("count", { count: saved.length })}</p>}
      </div>
      {!hydrated ? (
        <div aria-hidden className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <div className="max-w-xl py-16">
          <p className="font-serif text-h3">{t("empty")}</p>
          <p className="mt-3 text-body text-stone">{t("emptyText")}</p>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/shop">{tc("emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-6">
          {saved.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} sizes="(min-width: 1024px) 25vw, 50vw" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

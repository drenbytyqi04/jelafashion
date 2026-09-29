"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import type { CatalogProduct } from "@/lib/catalog/types";
import { useRecentlyViewed } from "@/stores/recently-viewed";
import { ProductRail } from "./product-rail";

/** Records this dress as viewed and shows up to 8 others viewed before it. */
export function RecentlyViewed({ current, catalog }: { current: string; catalog: CatalogProduct[] }) {
  const t = useTranslations("product");
  const slugs = useRecentlyViewed((s) => s.slugs);
  const push = useRecentlyViewed((s) => s.push);

  useEffect(() => {
    // Wait for the persisted list to load before adding to it.
    const add = () => push(current);
    if (useRecentlyViewed.persist.hasHydrated()) add();
    else return useRecentlyViewed.persist.onFinishHydration(add);
  }, [current, push]);

  const products = useMemo(
    () =>
      slugs
        .filter((s) => s !== current)
        .map((s) => catalog.find((p) => p.slug === s))
        .filter((p): p is CatalogProduct => !!p)
        .slice(0, 8),
    [catalog, current, slugs],
  );

  return <ProductRail id="recently-viewed" title={t("recentlyViewed")} products={products} />;
}

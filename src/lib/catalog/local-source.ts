import "server-only";
import { localMediaUrl, readLocalDb } from "@/lib/local-db";
import type { AdminProduct } from "./admin-types";
import type { CatalogProduct } from "./types";

export function toCatalogProduct(p: AdminProduct): CatalogProduct {
  return {
    id: p.id,
    slug: p.slug,
    category: p.category,
    name: p.name,
    description: p.description,
    fabricCare: p.fabricCare,
    priceCents: p.priceCents,
    availability: p.availability,
    productionWeeks: p.productionWeeks,
    length: p.length,
    sleeves: p.sleeves,
    silhouette: p.silhouette,
    featured: p.featured,
    publishedAt: p.publishedAt ?? p.createdAt,
    colors: p.colors,
    images: p.images.flatMap((i) => {
      const url = i.url ?? localMediaUrl("product-images", i.path);
      return url ? [{ url, alt: i.alt, width: i.width, height: i.height, colorId: i.colorId }] : [];
    }),
    sizes: p.sizes,
    measurements: p.measurements,
    seo: { title: p.seoTitle, description: p.seoDescription },
  };
}

export async function localPublishedProducts(): Promise<CatalogProduct[]> {
  const db = await readLocalDb();
  return db.products.filter((p) => p.published).map(toCatalogProduct);
}

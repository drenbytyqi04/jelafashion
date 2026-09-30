import "server-only";
import { unstable_cache } from "next/cache";
import { localCatalog, localMediaUrl, readLocalDb } from "@/lib/local-db";
import { publicSupabase, storagePublicUrl } from "@/lib/supabase/public-client";
import { localPublishedProducts } from "./local-source";
import * as seed from "./seed-data";
import type {
  CatalogCategory,
  CatalogProduct,
  CategoryId,
  HeroContent,
  MeasurementDefinition,
  Size,
  Testimonial,
} from "./types";

/** Tag for on-demand revalidation after admin edits (Phase 5). */
export const CATALOG_TAG = "catalog";
const REVALIDATE_SECONDS = 300;

// The whole published catalog is small (a boutique range), so it is loaded once, cached,
// and filtered in memory. Revisit if the range grows past a few hundred dresses.

type ProductRow = {
  id: string;
  slug: string;
  category_id: CategoryId;
  name_sq: string;
  name_en: string;
  description_sq: string;
  description_en: string;
  fabric_care_sq: string;
  fabric_care_en: string;
  price_cents: number;
  availability: CatalogProduct["availability"];
  production_weeks: number | null;
  length: CatalogProduct["length"];
  sleeves: CatalogProduct["sleeves"];
  silhouette: string | null;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  product_colors: { id: string; name_sq: string; name_en: string; hex: string; family: string; sort: number }[];
  product_images: {
    storage_path: string;
    alt_sq: string;
    alt_en: string;
    width: number | null;
    height: number | null;
    color_id: string | null;
    sort: number;
  }[];
  product_sizes: { size: Size; stock: number }[];
  product_measurements: { measurement_id: string }[];
};

const SIZE_ORDER: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

function fromRow(r: ProductRow): CatalogProduct {
  return {
    id: r.id,
    slug: r.slug,
    category: r.category_id,
    name: { sq: r.name_sq, en: r.name_en },
    description: { sq: r.description_sq, en: r.description_en },
    fabricCare: { sq: r.fabric_care_sq, en: r.fabric_care_en },
    priceCents: r.price_cents,
    availability: r.availability,
    productionWeeks: r.production_weeks,
    length: r.length,
    sleeves: r.sleeves,
    silhouette: r.silhouette,
    featured: r.featured,
    publishedAt: r.published_at ?? r.created_at,
    colors: [...r.product_colors]
      .sort((a, b) => a.sort - b.sort)
      .map((c) => ({ id: c.id, name: { sq: c.name_sq, en: c.name_en }, hex: c.hex, family: c.family })),
    images: [...r.product_images]
      .sort((a, b) => a.sort - b.sort)
      .flatMap((i) => {
        const url = storagePublicUrl("product-images", i.storage_path);
        return url
          ? [{ url, alt: { sq: i.alt_sq, en: i.alt_en }, width: i.width, height: i.height, colorId: i.color_id }]
          : [];
      }),
    sizes: [...r.product_sizes].sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    measurements: r.product_measurements.map((m) => m.measurement_id),
  };
}

function fromSeed(): CatalogProduct[] {
  const day = 24 * 60 * 60 * 1000;
  // A fixed reference date keeps the fallback deterministic between server renders.
  const ref = Date.UTC(2026, 8, 29);
  return seed.products.map((p) => ({
    id: p.slug,
    slug: p.slug,
    category: p.category,
    name: p.name,
    description: p.description,
    fabricCare: p.fabricCare,
    priceCents: Math.round(p.priceEUR * 100),
    availability: p.availability,
    productionWeeks: p.productionWeeks,
    length: p.length,
    sleeves: p.sleeves,
    silhouette: p.silhouette,
    featured: !!p.featured,
    publishedAt: new Date(ref - p.publishedDaysAgo * day).toISOString(),
    colors: p.colors.map((c, i) => ({ id: `${p.slug}-${i}`, ...c })),
    images: [],
    sizes: SIZE_ORDER.filter((s) => s in p.sizes).map((s) => ({ size: s, stock: p.sizes[s] ?? 0 })),
    measurements: p.measurements,
  }));
}

export const getCatalog = unstable_cache(
  async (): Promise<CatalogProduct[]> => {
    if (localCatalog()) return localPublishedProducts();
    const db = publicSupabase();
    if (!db) return fromSeed();
    const { data, error } = await db
      .from("products")
      .select(
        `id, slug, category_id, name_sq, name_en, description_sq, description_en, fabric_care_sq, fabric_care_en,
         price_cents, availability, production_weeks, length, sleeves, silhouette, featured, published_at, created_at,
         product_colors (id, name_sq, name_en, hex, family, sort),
         product_images (storage_path, alt_sq, alt_en, width, height, color_id, sort),
         product_sizes (size, stock),
         product_measurements (measurement_id)`,
      )
      .eq("published", true);
    if (error) throw new Error(`Catalog query failed: ${error.message}`);
    return (data as unknown as ProductRow[]).map(fromRow);
  },
  ["catalog-products"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

export const getCategories = unstable_cache(
  async (): Promise<CatalogCategory[]> => {
    const db = publicSupabase();
    if (!db) {
      return seed.categories.map((c) => ({ id: c.id, name: { ...c.name }, intro: { ...c.intro }, bannerUrl: null }));
    }
    const { data, error } = await db.from("categories").select("*").order("sort");
    if (error) throw new Error(`Categories query failed: ${error.message}`);
    return data.map((c) => ({
      id: c.id,
      name: { sq: c.name_sq, en: c.name_en },
      intro: { sq: c.intro_sq ?? "", en: c.intro_en ?? "" },
      bannerUrl: storagePublicUrl("site-media", c.banner_image_path),
    }));
  },
  ["catalog-categories"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

export const getTestimonials = unstable_cache(
  async (): Promise<Testimonial[]> => {
    if (localCatalog()) {
      const local = await readLocalDb();
      return local.testimonials
        .filter((t) => t.published)
        .sort((a, b) => a.sort - b.sort)
        .map((t) => ({ id: t.id, quote: t.quote, author: t.author, location: t.location }));
    }
    const db = publicSupabase();
    if (!db) {
      return seed.testimonials.map((t, i) => ({ id: String(i), quote: t.quote, author: t.author, location: t.location }));
    }
    const { data, error } = await db.from("testimonials").select("*").eq("published", true).order("sort");
    if (error) throw new Error(`Testimonials query failed: ${error.message}`);
    return data.map((t) => ({ id: t.id, quote: { sq: t.quote_sq, en: t.quote_en }, author: t.author, location: t.location }));
  },
  ["site-testimonials"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

export const getHeroContent = unstable_cache(
  async (): Promise<HeroContent> => {
    const db = publicSupabase();
    const fallback = seed.siteContent.hero as {
      videoPath: string | null;
      posterPath: string | null;
      headline: HeroContent["headline"];
      subtitle: HeroContent["subtitle"];
    };
    let value = fallback;
    if (localCatalog()) {
      const hero = (await readLocalDb()).hero;
      return {
        videoUrl: localMediaUrl("site-media", hero.videoPath),
        posterUrl: localMediaUrl("site-media", hero.posterPath),
        headline: hero.headline,
        subtitle: hero.subtitle,
      };
    }
    if (db) {
      const { data, error } = await db.from("site_content").select("value").eq("key", "hero").maybeSingle();
      if (error) throw new Error(`Hero content query failed: ${error.message}`);
      if (data) value = data.value as typeof fallback;
    }
    return {
      videoUrl: storagePublicUrl("site-media", value.videoPath),
      posterUrl: storagePublicUrl("site-media", value.posterPath),
      headline: value.headline,
      subtitle: value.subtitle,
    };
  },
  ["site-hero"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

/** Marquee lines under the hero; null falls back to the copy in messages. */
export const getMarquee = unstable_cache(
  async (): Promise<{ sq: string[]; en: string[] } | null> => {
    if (localCatalog()) return (await readLocalDb()).marquee;
    const db = publicSupabase();
    if (!db) return null;
    const { data, error } = await db.from("site_content").select("value").eq("key", "marquee").maybeSingle();
    if (error) throw new Error(`Marquee query failed: ${error.message}`);
    return (data?.value as { sq: string[]; en: string[] } | undefined) ?? null;
  },
  ["site-marquee"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

export async function getNewIn(limit: number) {
  const all = await getCatalog();
  return [...all].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}

export const getMeasurementDefinitions = unstable_cache(
  async (): Promise<MeasurementDefinition[]> => {
    const db = publicSupabase();
    if (!db) {
      return seed.measurementDefinitions.map((m, i) => ({ ...m, sort: i + 1 }));
    }
    const { data, error } = await db.from("measurement_definitions").select("*").order("sort");
    if (error) throw new Error(`Measurement definitions query failed: ${error.message}`);
    return data.map((m) => ({
      id: m.id,
      kind: m.kind,
      view: m.view,
      label: { sq: m.label_sq, en: m.label_en },
      hint: { sq: m.hint_sq, en: m.hint_en },
      minCm: Number(m.min_cm),
      maxCm: Number(m.max_cm),
      alwaysRequired: m.always_required,
      sort: m.sort,
    }));
  },
  ["measurement-definitions"],
  { tags: [CATALOG_TAG], revalidate: REVALIDATE_SECONDS },
);

export async function getProduct(slug: string) {
  const all = await getCatalog();
  return all.find((p) => p.slug === slug) ?? null;
}

/** Measurements a product asks for, in wizard order: always-required first, then its own. */
export async function getProductMeasurements(product: CatalogProduct) {
  const defs = await getMeasurementDefinitions();
  return defs
    .filter((d) => d.alwaysRequired || product.measurements.includes(d.id))
    .sort((a, b) => a.sort - b.sort);
}

import type { Availability, CatalogProduct, CategoryId, Length, Sleeves } from "./types";

// URL <-> filter state for collection pages. Pure functions, used on server and client.

export const PAGE_SIZE = 8;

export const SORTS = ["newest", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

export const PRICE_BANDS = ["under-500", "500-1000", "over-1000"] as const;
export type PriceBand = (typeof PRICE_BANDS)[number];

export const LENGTHS: Length[] = ["mini", "knee", "floor"];
export const SLEEVES: Sleeves[] = ["sleeveless", "short", "long"];
export const CATEGORIES: CategoryId[] = ["bridal", "evening", "short"];
export const AVAILABILITY: Availability[] = ["in_stock", "made_to_order"];

export type Filters = {
  category: CategoryId[];
  color: string[];
  length: Length[];
  sleeves: Sleeves[];
  price: PriceBand[];
  availability: Availability[];
  sort: Sort;
  page: number;
};

export type FilterKey = "category" | "color" | "length" | "sleeves" | "price" | "availability";
export const FILTER_KEYS: FilterKey[] = ["category", "color", "length", "sleeves", "price", "availability"];

type Params = Record<string, string | string[] | undefined>;

function list<T extends string>(value: string | string[] | undefined, allowed?: readonly T[]): T[] {
  const raw = (Array.isArray(value) ? value.join(",") : (value ?? "")).split(",").map((v) => v.trim()).filter(Boolean);
  const unique = [...new Set(raw)];
  return (allowed ? unique.filter((v): v is T => (allowed as readonly string[]).includes(v)) : unique) as T[];
}

export function parseFilters(params: Params): Filters {
  const sort = (SORTS as readonly string[]).includes(String(params.sort)) ? (params.sort as Sort) : "newest";
  const page = Math.min(Math.max(parseInt(String(params.page ?? "1"), 10) || 1, 1), 50);
  return {
    category: list(params.category, CATEGORIES),
    color: list(params.color).filter((c) => /^[a-z-]{2,20}$/.test(c)),
    length: list(params.length, LENGTHS),
    sleeves: list(params.sleeves, SLEEVES),
    price: list(params.price, PRICE_BANDS),
    availability: list(params.availability, AVAILABILITY),
    sort,
    page,
  };
}

/** Serialises filters to a query string, omitting defaults. */
export function filtersToQuery(f: Filters): string {
  const q = new URLSearchParams();
  for (const key of FILTER_KEYS) if (f[key].length) q.set(key, f[key].join(","));
  if (f.sort !== "newest") q.set("sort", f.sort);
  if (f.page > 1) q.set("page", String(f.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

function inBand(cents: number, band: PriceBand) {
  const eur = cents / 100;
  if (band === "under-500") return eur < 500;
  if (band === "500-1000") return eur >= 500 && eur <= 1000;
  return eur > 1000;
}

export function applyFilters(products: CatalogProduct[], f: Filters): CatalogProduct[] {
  const filtered = products.filter(
    (p) =>
      (!f.category.length || f.category.includes(p.category)) &&
      (!f.color.length || p.colors.some((c) => f.color.includes(c.family))) &&
      (!f.length.length || f.length.includes(p.length)) &&
      (!f.sleeves.length || f.sleeves.includes(p.sleeves)) &&
      (!f.price.length || f.price.some((b) => inBand(p.priceCents, b))) &&
      (!f.availability.length || f.availability.includes(p.availability)),
  );
  const sorted = [...filtered];
  if (f.sort === "price-asc") sorted.sort((a, b) => a.priceCents - b.priceCents);
  else if (f.sort === "price-desc") sorted.sort((a, b) => b.priceCents - a.priceCents);
  else sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return sorted;
}

export function activeFilterCount(f: Filters) {
  return FILTER_KEYS.reduce((n, k) => n + f[k].length, 0);
}

/** Colour families present in a product set, with a representative hex for the swatch. */
export function colorFamilies(products: CatalogProduct[]) {
  const map = new Map<string, string>();
  for (const p of products) for (const c of p.colors) if (!map.has(c.family)) map.set(c.family, c.hex);
  return [...map.entries()].map(([family, hex]) => ({ family, hex }));
}

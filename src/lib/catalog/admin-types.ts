import type { Bilingual, CategoryId, Length, Size, Sleeves, Availability } from "./types";

// Editable shapes used by the admin panel and both data backends (Supabase, local file).

export type AdminColor = { id: string; name: Bilingual; hex: string; family: string };

export type AdminImage = {
  id: string;
  /** Path inside the product-images bucket (or the local media folder). */
  path: string;
  url: string | null;
  alt: Bilingual;
  width: number | null;
  height: number | null;
  colorId: string | null;
};

export type AdminProduct = {
  id: string;
  slug: string;
  category: CategoryId;
  name: Bilingual;
  description: Bilingual;
  fabricCare: Bilingual;
  priceCents: number;
  availability: Availability;
  productionWeeks: number | null;
  length: Length;
  sleeves: Sleeves;
  silhouette: string | null;
  featured: boolean;
  published: boolean;
  publishedAt: string | null;
  seoTitle: Bilingual;
  seoDescription: Bilingual;
  colors: AdminColor[];
  images: AdminImage[];
  sizes: { size: Size; stock: number }[];
  /** Conditional measurement ids on top of the always-required set. */
  measurements: string[];
  createdAt: string;
  updatedAt: string;
};

export type AdminCollection = {
  id: string;
  slug: string;
  name: Bilingual;
  description: Bilingual;
  published: boolean;
  sort: number;
  productIds: string[];
};

export type AdminDiscount = {
  id: string;
  code: string;
  kind: "percent" | "fixed";
  /** percent: 1–100; fixed: cents */
  value: number;
  minSubtotalCents: number;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  createdAt: string;
};

export type HeroSettings = {
  videoPath: string | null;
  posterPath: string | null;
  headline: { sq: string[]; en: string[] };
  subtitle: Bilingual;
};

export type MarqueeSettings = { sq: string[]; en: string[] };

export type AdminTestimonial = {
  id: string;
  quote: Bilingual;
  author: string;
  location: string | null;
  published: boolean;
  sort: number;
};

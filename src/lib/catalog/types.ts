import type { Bilingual } from "./seed-data";

export type { Bilingual };
export type Locale = "sq" | "en";
export type CategoryId = "bridal" | "evening" | "short";
export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type Length = "mini" | "knee" | "midi" | "floor";
export type Sleeves = "sleeveless" | "short" | "long";
export type Availability = "in_stock" | "made_to_order";

export type CatalogColor = { id: string; name: Bilingual; hex: string; family: string };
export type CatalogImage = { url: string; alt: Bilingual; width: number | null; height: number | null; colorId: string | null };

export type CatalogProduct = {
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
  publishedAt: string;
  colors: CatalogColor[];
  images: CatalogImage[];
  sizes: { size: Size; stock: number }[];
  /** Conditional measurement ids required on top of the always-required set. */
  measurements: string[];
};

export type CatalogCategory = { id: CategoryId; name: Bilingual; intro: Bilingual; bannerUrl: string | null };

export type Testimonial = { id: string; quote: Bilingual; author: string; location: string | null };

export type HeroContent = {
  videoUrl: string | null;
  posterUrl: string | null;
  headline: { sq: string[]; en: string[] };
  subtitle: Bilingual;
};

export const SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

export const pick = (b: Bilingual, locale: Locale) => b[locale] || b.sq;

export type MeasurementKind = "around" | "straight" | "heel";
export type MeasurementView = "front" | "back" | "side" | "shoe";

export type MeasurementDefinition = {
  id: string;
  kind: MeasurementKind;
  view: MeasurementView;
  label: Bilingual;
  hint: Bilingual;
  minCm: number;
  maxCm: number;
  alwaysRequired: boolean;
  sort: number;
};

import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MeasurementProfile, Role, SavedAddress } from "@/lib/account/types";
import type { AdminCollection, AdminDiscount, AdminProduct, AdminTestimonial, HeroSettings, MarqueeSettings } from "@/lib/catalog/admin-types";
import * as seed from "@/lib/catalog/seed-data";
import type { Size } from "@/lib/catalog/types";
import type { Order, PaymentMethodConfig, ShippingZone } from "@/lib/commerce/types";
import { publicSupabase } from "@/lib/supabase/public-client";
import { serviceSupabase } from "@/lib/supabase/service-client";

/**
 * Development database: one JSON file (.data/db.json), created from the sample data on
 * first use. It lets the whole site (catalog, checkout, accounts, admin) run on a laptop
 * without any Supabase credentials. Never used in a production deployment, except under
 * JF_LOCAL_DATA=1 for local QA of a production build.
 */

export type LocalUser = { id: string; email: string; fullName: string | null; phone: string | null; locale: "sq" | "en"; role: Role; createdAt: string };

export type LocalDb = {
  version: 1;
  secret: string;
  products: AdminProduct[];
  collections: AdminCollection[];
  discounts: AdminDiscount[];
  shippingZones: (ShippingZone & { sort: number })[];
  paymentMethods: (PaymentMethodConfig & { enabled: boolean; sort: number })[];
  hero: HeroSettings;
  marquee: MarqueeSettings;
  testimonials: AdminTestimonial[];
  newsletter: { email: string; locale: string; createdAt: string }[];
  orders: (Order & { userId: string | null; events: { status: string; note: string | null; createdAt: string }[] })[];
  nextOrderNumber: number;
  callbacks: unknown[];
  users: LocalUser[];
  addresses: (SavedAddress & { userId: string })[];
  profiles: (MeasurementProfile & { userId: string })[];
};

export function localDataEnabled() {
  if (process.env.NODE_ENV !== "production") return true;
  return process.env.JF_LOCAL_DATA === "1" || process.env.JF_LOCAL_ORDERS === "1";
}

/** Catalog and content come from the local file only when no Supabase project is configured. */
export const localCatalog = () => !publicSupabase() && localDataEnabled();
/** Orders, accounts and admin writes are local when the service key is missing. */
export const localWrites = () => !serviceSupabase() && localDataEnabled();

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "db.json");
export const LOCAL_MEDIA_DIR = path.join(DIR, "media");

const SIZE_ORDER: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

function fromSeed(): LocalDb {
  const day = 24 * 60 * 60 * 1000;
  const ref = Date.UTC(2026, 8, 29);
  const now = new Date().toISOString();
  const products: AdminProduct[] = seed.products.map((p) => ({
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
    published: true,
    publishedAt: new Date(ref - p.publishedDaysAgo * day).toISOString(),
    seoTitle: { sq: "", en: "" },
    seoDescription: { sq: "", en: "" },
    colors: p.colors.map((c, i) => ({ id: `${p.slug}-${i}`, ...c })),
    images: [],
    sizes: SIZE_ORDER.filter((s) => s in p.sizes).map((s) => ({ size: s, stock: p.sizes[s] ?? 0 })),
    measurements: p.measurements,
    createdAt: now,
    updatedAt: now,
  }));
  return {
    version: 1,
    secret: randomBytes(32).toString("hex"),
    products,
    collections: seed.collections.map((c, i) => ({
      id: `collection-${i}`,
      slug: c.slug,
      name: c.name,
      description: c.description,
      published: true,
      sort: c.sort,
      productIds: c.products,
    })),
    discounts: seed.discountCodes.map((d, i) => ({
      id: `discount-${i}`,
      code: d.code,
      kind: d.kind,
      value: d.value,
      minSubtotalCents: 0,
      startsAt: null,
      expiresAt: d.expiresAt,
      usageLimit: d.usageLimit,
      usedCount: 0,
      active: true,
      createdAt: now,
    })),
    shippingZones: seed.shippingZones.map((z, i) => ({
      id: `zone-${i}`,
      name: z.name,
      countries: z.countries,
      isFallback: z.isFallback,
      sort: i + 1,
      rates: z.rates.map((r, j) => ({
        id: `rate-${i}-${j}`,
        name: r.name,
        priceCents: Math.round(r.priceEUR * 100),
        freeOverCents: r.freeOverEUR === null ? null : Math.round(r.freeOverEUR * 100),
        minDays: r.minDays,
        maxDays: r.maxDays,
      })),
    })),
    paymentMethods: seed.paymentMethods.map((m) => ({ ...(m as PaymentMethodConfig), enabled: true, sort: m.sort })),
    hero: seed.siteContent.hero as HeroSettings,
    marquee: seed.siteContent.marquee as MarqueeSettings,
    testimonials: seed.testimonials.map((t, i) => ({
      id: `testimonial-${i}`,
      quote: t.quote,
      author: t.author,
      location: t.location,
      published: true,
      sort: t.sort,
    })),
    newsletter: [],
    orders: [],
    nextOrderNumber: 1001,
    callbacks: [],
    users: [],
    addresses: [],
    profiles: [],
  };
}

let queue: Promise<unknown> = Promise.resolve();

export async function readLocalDb(): Promise<LocalDb> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as LocalDb;
  } catch {
    const db = fromSeed();
    await mkdir(DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(db, null, 2));
    return db;
  }
}

/** Read-modify-write, serialised within this process (one developer, one server). */
export function mutateLocalDb<T>(fn: (db: LocalDb) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readLocalDb();
    const result = await fn(db);
    await mkdir(DIR, { recursive: true });
    await writeFile(FILE, JSON.stringify(db, null, 2));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

/** Public URL for a file in the local media folder (served by /api/local-media in dev). */
export const localMediaUrl = (bucket: string, p: string | null | undefined) => (p ? `/api/local-media/${bucket}/${p}` : null);

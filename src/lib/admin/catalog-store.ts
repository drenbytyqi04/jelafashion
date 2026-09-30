import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdminCollection,
  AdminDiscount,
  AdminProduct,
  AdminTestimonial,
  HeroSettings,
  MarqueeSettings,
} from "@/lib/catalog/admin-types";
import * as seed from "@/lib/catalog/seed-data";
import type { Size } from "@/lib/catalog/types";
import type { PaymentMethodConfig, PaymentMethodId, ShippingZone } from "@/lib/commerce/types";
import { LOCAL_MEDIA_DIR, localMediaUrl, localWrites, mutateLocalDb, readLocalDb } from "@/lib/local-db";
import { storagePublicUrl } from "@/lib/supabase/public-client";
import { serviceSupabase } from "@/lib/supabase/service-client";

export type AdminZone = ShippingZone & { sort: number };
export type AdminPaymentMethod = PaymentMethodConfig & { enabled: boolean; sort: number };
export type MediaBucket = "product-images" | "site-media";
export type UploadedMedia = { path: string; url: string };
export type AdminCustomer = { id: string; email: string; fullName: string | null; phone: string | null; role: "customer" | "admin"; createdAt: string };
export type Subscriber = { email: string; locale: string; createdAt: string; unsubscribed: boolean };

/**
 * Everything the admin panel edits besides orders. Callers must have passed requireAdmin;
 * the Supabase backend uses the service role, so this module is the only gate.
 */
export interface CatalogAdminStore {
  products(): Promise<AdminProduct[]>;
  product(id: string): Promise<AdminProduct | null>;
  saveProduct(p: AdminProduct): Promise<AdminProduct>;
  deleteProduct(id: string): Promise<void>;
  upload(bucket: MediaBucket, bytes: Uint8Array, contentType: string, extension: string, folder: string): Promise<UploadedMedia>;
  removeMedia(bucket: MediaBucket, paths: string[]): Promise<void>;
  collections(): Promise<AdminCollection[]>;
  saveCollection(c: AdminCollection): Promise<void>;
  deleteCollection(id: string): Promise<void>;
  discounts(): Promise<AdminDiscount[]>;
  saveDiscount(d: AdminDiscount): Promise<void>;
  deleteDiscount(id: string): Promise<void>;
  zones(): Promise<AdminZone[]>;
  saveZone(z: AdminZone): Promise<void>;
  deleteZone(id: string): Promise<void>;
  paymentMethods(): Promise<AdminPaymentMethod[]>;
  savePaymentMethod(m: AdminPaymentMethod): Promise<void>;
  hero(): Promise<HeroSettings>;
  saveHero(h: HeroSettings): Promise<void>;
  marquee(): Promise<MarqueeSettings>;
  saveMarquee(m: MarqueeSettings): Promise<void>;
  testimonials(): Promise<AdminTestimonial[]>;
  saveTestimonial(t: AdminTestimonial): Promise<void>;
  deleteTestimonial(id: string): Promise<void>;
  customers(): Promise<AdminCustomer[]>;
  subscribers(): Promise<Subscriber[]>;
}

const SIZE_ORDER: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];
const fail = (what: string, error: { message: string } | null) => {
  if (error) throw new Error(`${what}: ${error.message}`);
};

// ---------------------------------------------------------------------------------------
// Supabase

type ProductRow = {
  id: string;
  slug: string;
  category_id: AdminProduct["category"];
  name_sq: string;
  name_en: string;
  description_sq: string;
  description_en: string;
  fabric_care_sq: string;
  fabric_care_en: string;
  price_cents: number;
  availability: AdminProduct["availability"];
  production_weeks: number | null;
  length: AdminProduct["length"];
  sleeves: AdminProduct["sleeves"];
  silhouette: string | null;
  featured: boolean;
  published: boolean;
  published_at: string | null;
  seo_title_sq: string | null;
  seo_title_en: string | null;
  seo_description_sq: string | null;
  seo_description_en: string | null;
  created_at: string;
  updated_at: string;
  product_colors: { id: string; name_sq: string; name_en: string; hex: string; family: string; sort: number }[];
  product_images: { id: string; storage_path: string; alt_sq: string; alt_en: string; width: number | null; height: number | null; color_id: string | null; sort: number }[];
  product_sizes: { size: Size; stock: number }[];
  product_measurements: { measurement_id: string }[];
};

const PRODUCT_SELECT = `*, product_colors (id, name_sq, name_en, hex, family, sort),
  product_images (id, storage_path, alt_sq, alt_en, width, height, color_id, sort),
  product_sizes (size, stock), product_measurements (measurement_id)`;

function productFromRow(r: ProductRow): AdminProduct {
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
    published: r.published,
    publishedAt: r.published_at,
    seoTitle: { sq: r.seo_title_sq ?? "", en: r.seo_title_en ?? "" },
    seoDescription: { sq: r.seo_description_sq ?? "", en: r.seo_description_en ?? "" },
    colors: [...r.product_colors].sort((a, b) => a.sort - b.sort).map((c) => ({ id: c.id, name: { sq: c.name_sq, en: c.name_en }, hex: c.hex, family: c.family })),
    images: [...r.product_images]
      .sort((a, b) => a.sort - b.sort)
      .map((i) => ({
        id: i.id,
        path: i.storage_path,
        url: storagePublicUrl("product-images", i.storage_path),
        alt: { sq: i.alt_sq, en: i.alt_en },
        width: i.width,
        height: i.height,
        colorId: i.color_id,
      })),
    sizes: [...r.product_sizes].sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)),
    measurements: r.product_measurements.map((m) => m.measurement_id),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function replaceChildren(db: SupabaseClient, table: string, productId: string, rows: object[]) {
  fail(`${table} clear`, (await db.from(table).delete().eq("product_id", productId)).error);
  if (rows.length) fail(`${table} insert`, (await db.from(table).insert(rows)).error);
}

/** Upsert rows by id and delete the ones that are gone. */
async function syncById(db: SupabaseClient, table: string, productId: string, rows: { id: string }[]) {
  const { data, error } = await db.from(table).select("id").eq("product_id", productId);
  fail(`${table} read`, error);
  const keep = new Set(rows.map((r) => r.id));
  const gone = (data ?? []).map((r) => r.id as string).filter((id) => !keep.has(id));
  if (gone.length) fail(`${table} delete`, (await db.from(table).delete().in("id", gone)).error);
  if (rows.length) fail(`${table} upsert`, (await db.from(table).upsert(rows)).error);
}

class SupabaseCatalogAdmin implements CatalogAdminStore {
  constructor(private db: SupabaseClient) {}

  async products() {
    const { data, error } = await this.db.from("products").select(PRODUCT_SELECT).order("created_at", { ascending: false });
    fail("Products", error);
    return (data as ProductRow[]).map(productFromRow);
  }

  async product(id: string) {
    const { data, error } = await this.db.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
    fail("Product", error);
    return data ? productFromRow(data as ProductRow) : null;
  }

  async saveProduct(p: AdminProduct) {
    const db = this.db;
    const row = {
      id: p.id,
      slug: p.slug,
      category_id: p.category,
      name_sq: p.name.sq,
      name_en: p.name.en,
      description_sq: p.description.sq,
      description_en: p.description.en,
      fabric_care_sq: p.fabricCare.sq,
      fabric_care_en: p.fabricCare.en,
      price_cents: p.priceCents,
      availability: p.availability,
      production_weeks: p.productionWeeks,
      length: p.length,
      sleeves: p.sleeves,
      silhouette: p.silhouette,
      featured: p.featured,
      published: p.published,
      published_at: p.publishedAt,
      seo_title_sq: p.seoTitle.sq || null,
      seo_title_en: p.seoTitle.en || null,
      seo_description_sq: p.seoDescription.sq || null,
      seo_description_en: p.seoDescription.en || null,
    };
    fail("Product save", (await db.from("products").upsert(row)).error);
    await syncById(db, "product_colors", p.id, p.colors.map((c, i) => ({ id: c.id, product_id: p.id, name_sq: c.name.sq, name_en: c.name.en, hex: c.hex, family: c.family, sort: i })));
    // Images removed in the form also leave the bucket.
    const before = await this.product(p.id);
    const removed = (before?.images ?? []).filter((i) => !p.images.some((x) => x.id === i.id)).map((i) => i.path);
    await syncById(
      db,
      "product_images",
      p.id,
      p.images.map((img, i) => ({ id: img.id, product_id: p.id, color_id: img.colorId, storage_path: img.path, alt_sq: img.alt.sq, alt_en: img.alt.en, width: img.width, height: img.height, sort: i })),
    );
    if (removed.length) await this.removeMedia("product-images", removed);
    await replaceChildren(db, "product_sizes", p.id, p.sizes.map((s) => ({ product_id: p.id, size: s.size, stock: s.stock })));
    await replaceChildren(db, "product_measurements", p.id, p.measurements.map((m) => ({ product_id: p.id, measurement_id: m })));
    const saved = await this.product(p.id);
    if (!saved) throw new Error("Product vanished after save");
    return saved;
  }

  async deleteProduct(id: string) {
    const p = await this.product(id);
    fail("Product delete", (await this.db.from("products").delete().eq("id", id)).error);
    if (p?.images.length) await this.removeMedia("product-images", p.images.map((i) => i.path));
  }

  async upload(bucket: MediaBucket, bytes: Uint8Array, contentType: string, extension: string, folder: string) {
    const p = `${folder}/${randomUUID()}.${extension}`;
    fail("Upload", (await this.db.storage.from(bucket).upload(p, bytes, { contentType, upsert: false })).error);
    return { path: p, url: storagePublicUrl(bucket, p)! };
  }

  async removeMedia(bucket: MediaBucket, paths: string[]) {
    const { error } = await this.db.storage.from(bucket).remove(paths);
    if (error) console.warn("[admin] media not removed", error.message);
  }

  async collections() {
    const { data, error } = await this.db.from("collections").select("*, collection_products (product_id, sort)").order("sort");
    fail("Collections", error);
    return (data ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      name: { sq: c.name_sq, en: c.name_en },
      description: { sq: c.description_sq ?? "", en: c.description_en ?? "" },
      published: c.published,
      sort: c.sort,
      productIds: (c.collection_products as { product_id: string; sort: number }[]).sort((a, b) => a.sort - b.sort).map((x) => x.product_id),
    }));
  }

  async saveCollection(c: AdminCollection) {
    fail(
      "Collection save",
      (await this.db.from("collections").upsert({ id: c.id, slug: c.slug, name_sq: c.name.sq, name_en: c.name.en, description_sq: c.description.sq, description_en: c.description.en, published: c.published, sort: c.sort })).error,
    );
    fail("Collection clear", (await this.db.from("collection_products").delete().eq("collection_id", c.id)).error);
    if (c.productIds.length) {
      fail("Collection products", (await this.db.from("collection_products").insert(c.productIds.map((pid, i) => ({ collection_id: c.id, product_id: pid, sort: i })))).error);
    }
  }

  async deleteCollection(id: string) {
    fail("Collection delete", (await this.db.from("collections").delete().eq("id", id)).error);
  }

  async discounts() {
    const { data, error } = await this.db.from("discount_codes").select("*").order("created_at", { ascending: false });
    fail("Discounts", error);
    return (data ?? []).map((d) => ({
      id: d.id,
      code: d.code,
      kind: d.kind,
      value: d.value,
      minSubtotalCents: d.min_subtotal_cents,
      startsAt: d.starts_at,
      expiresAt: d.expires_at,
      usageLimit: d.usage_limit,
      usedCount: d.used_count,
      active: d.active,
      createdAt: d.created_at,
    }));
  }

  async saveDiscount(d: AdminDiscount) {
    fail(
      "Discount save",
      (
        await this.db.from("discount_codes").upsert({
          id: d.id,
          code: d.code,
          kind: d.kind,
          value: d.value,
          min_subtotal_cents: d.minSubtotalCents,
          starts_at: d.startsAt,
          expires_at: d.expiresAt,
          usage_limit: d.usageLimit,
          active: d.active,
        })
      ).error,
    );
  }

  async deleteDiscount(id: string) {
    fail("Discount delete", (await this.db.from("discount_codes").delete().eq("id", id)).error);
  }

  async zones() {
    const { data, error } = await this.db.from("shipping_zones").select("*, shipping_rates (*)").order("sort");
    fail("Zones", error);
    return (data ?? []).map((z) => ({
      id: z.id,
      name: { sq: z.name_sq, en: z.name_en },
      countries: z.countries,
      isFallback: z.is_fallback,
      sort: z.sort,
      rates: (z.shipping_rates as { id: string; name_sq: string; name_en: string; price_cents: number; free_over_cents: number | null; min_days: number; max_days: number; sort: number }[])
        .sort((a, b) => a.sort - b.sort)
        .map((r) => ({ id: r.id, name: { sq: r.name_sq, en: r.name_en }, priceCents: r.price_cents, freeOverCents: r.free_over_cents, minDays: r.min_days, maxDays: r.max_days })),
    }));
  }

  async saveZone(z: AdminZone) {
    // Only one fallback zone (unique index): clear the others first.
    if (z.isFallback) fail("Fallback", (await this.db.from("shipping_zones").update({ is_fallback: false }).neq("id", z.id).eq("is_fallback", true)).error);
    fail("Zone save", (await this.db.from("shipping_zones").upsert({ id: z.id, name_sq: z.name.sq, name_en: z.name.en, countries: z.countries, is_fallback: z.isFallback, sort: z.sort })).error);
    const { data, error } = await this.db.from("shipping_rates").select("id").eq("zone_id", z.id);
    fail("Rates read", error);
    const gone = (data ?? []).map((r) => r.id).filter((id) => !z.rates.some((r) => r.id === id));
    if (gone.length) fail("Rates delete", (await this.db.from("shipping_rates").delete().in("id", gone)).error);
    if (z.rates.length) {
      fail(
        "Rates save",
        (
          await this.db.from("shipping_rates").upsert(
            z.rates.map((r, i) => ({ id: r.id, zone_id: z.id, name_sq: r.name.sq, name_en: r.name.en, price_cents: r.priceCents, free_over_cents: r.freeOverCents, min_days: r.minDays, max_days: r.maxDays, active: true, sort: i })),
          )
        ).error,
      );
    }
  }

  async deleteZone(id: string) {
    fail("Zone delete", (await this.db.from("shipping_zones").delete().eq("id", id)).error);
  }

  async paymentMethods() {
    const { data, error } = await this.db.from("payment_methods").select("*").order("sort");
    fail("Payment methods", error);
    return data as AdminPaymentMethod[];
  }

  async savePaymentMethod(m: AdminPaymentMethod) {
    fail("Payment method save", (await this.db.from("payment_methods").update({ enabled: m.enabled, sort: m.sort, details: m.details }).eq("id", m.id)).error);
  }

  private async content<T>(key: string, fallback: T): Promise<T> {
    const { data, error } = await this.db.from("site_content").select("value").eq("key", key).maybeSingle();
    fail("Content", error);
    return (data?.value as T) ?? fallback;
  }

  private async saveContent(key: string, value: unknown) {
    fail("Content save", (await this.db.from("site_content").upsert({ key, value })).error);
  }

  hero() {
    return this.content("hero", seed.siteContent.hero as HeroSettings);
  }
  saveHero(h: HeroSettings) {
    return this.saveContent("hero", h);
  }
  marquee() {
    return this.content("marquee", seed.siteContent.marquee as MarqueeSettings);
  }
  saveMarquee(m: MarqueeSettings) {
    return this.saveContent("marquee", m);
  }

  async testimonials() {
    const { data, error } = await this.db.from("testimonials").select("*").order("sort");
    fail("Testimonials", error);
    return (data ?? []).map((t) => ({ id: t.id, quote: { sq: t.quote_sq, en: t.quote_en }, author: t.author, location: t.location, published: t.published, sort: t.sort }));
  }

  async saveTestimonial(t: AdminTestimonial) {
    fail(
      "Testimonial save",
      (await this.db.from("testimonials").upsert({ id: t.id, quote_sq: t.quote.sq, quote_en: t.quote.en, author: t.author, location: t.location, published: t.published, sort: t.sort })).error,
    );
  }

  async deleteTestimonial(id: string) {
    fail("Testimonial delete", (await this.db.from("testimonials").delete().eq("id", id)).error);
  }

  async customers() {
    const [{ data: profiles, error }, users] = await Promise.all([
      this.db.from("profiles").select("id, full_name, phone, role, created_at").order("created_at", { ascending: false }),
      this.db.auth.admin.listUsers({ perPage: 1000 }),
    ]);
    fail("Customers", error);
    const emails = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return (profiles ?? []).map((p) => ({ id: p.id, email: emails.get(p.id) ?? "", fullName: p.full_name, phone: p.phone, role: p.role, createdAt: p.created_at }));
  }

  async subscribers() {
    const { data, error } = await this.db.from("newsletter_subscribers").select("email, locale, created_at, unsubscribed_at").order("created_at", { ascending: false });
    fail("Subscribers", error);
    return (data ?? []).map((s) => ({ email: s.email, locale: s.locale, createdAt: s.created_at, unsubscribed: Boolean(s.unsubscribed_at) }));
  }
}

// ---------------------------------------------------------------------------------------
// Local development database

class LocalCatalogAdmin implements CatalogAdminStore {
  async products() {
    return [...(await readLocalDb()).products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async product(id: string) {
    return (await readLocalDb()).products.find((p) => p.id === id) ?? null;
  }
  saveProduct(p: AdminProduct) {
    return mutateLocalDb(async (db) => {
      const i = db.products.findIndex((x) => x.id === p.id);
      const removed = i >= 0 ? db.products[i].images.filter((img) => !p.images.some((x) => x.id === img.id)).map((img) => img.path) : [];
      const saved = { ...p, images: p.images.map((img) => ({ ...img, url: null })), updatedAt: new Date().toISOString() };
      if (i >= 0) db.products[i] = saved;
      else db.products.push(saved);
      await this.removeMedia("product-images", removed);
      return { ...saved, images: saved.images.map((img) => ({ ...img, url: localMediaUrl("product-images", img.path) })) };
    });
  }
  deleteProduct(id: string) {
    return mutateLocalDb((db) => {
      db.products = db.products.filter((p) => p.id !== id);
      db.collections.forEach((c) => (c.productIds = c.productIds.filter((x) => x !== id)));
    });
  }
  async upload(bucket: MediaBucket, bytes: Uint8Array, _contentType: string, extension: string, folder: string) {
    const rel = `${folder}/${randomUUID()}.${extension}`;
    await mkdir(path.join(LOCAL_MEDIA_DIR, bucket, folder), { recursive: true });
    await writeFile(path.join(LOCAL_MEDIA_DIR, bucket, rel), bytes);
    return { path: rel, url: localMediaUrl(bucket, rel)! };
  }
  async removeMedia(bucket: MediaBucket, paths: string[]) {
    await Promise.all(paths.map((p) => unlink(path.join(LOCAL_MEDIA_DIR, bucket, p)).catch(() => undefined)));
  }
  async collections() {
    return [...(await readLocalDb()).collections].sort((a, b) => a.sort - b.sort);
  }
  saveCollection(c: AdminCollection) {
    return mutateLocalDb((db) => upsert(db.collections, c));
  }
  deleteCollection(id: string) {
    return mutateLocalDb((db) => void (db.collections = db.collections.filter((c) => c.id !== id)));
  }
  async discounts() {
    return (await readLocalDb()).discounts;
  }
  saveDiscount(d: AdminDiscount) {
    return mutateLocalDb((db) => {
      const existing = db.discounts.find((x) => x.id === d.id);
      upsert(db.discounts, { ...d, usedCount: existing?.usedCount ?? 0, createdAt: existing?.createdAt ?? new Date().toISOString() });
    });
  }
  deleteDiscount(id: string) {
    return mutateLocalDb((db) => void (db.discounts = db.discounts.filter((d) => d.id !== id)));
  }
  async zones() {
    return [...(await readLocalDb()).shippingZones].sort((a, b) => a.sort - b.sort);
  }
  saveZone(z: AdminZone) {
    return mutateLocalDb((db) => {
      if (z.isFallback) db.shippingZones.forEach((x) => (x.isFallback = x.id === z.id));
      upsert(db.shippingZones, z);
    });
  }
  deleteZone(id: string) {
    return mutateLocalDb((db) => void (db.shippingZones = db.shippingZones.filter((z) => z.id !== id)));
  }
  async paymentMethods() {
    return [...(await readLocalDb()).paymentMethods].sort((a, b) => a.sort - b.sort);
  }
  savePaymentMethod(m: AdminPaymentMethod) {
    return mutateLocalDb((db) => upsert(db.paymentMethods, m));
  }
  async hero() {
    return (await readLocalDb()).hero;
  }
  saveHero(h: HeroSettings) {
    return mutateLocalDb((db) => void (db.hero = h));
  }
  async marquee() {
    return (await readLocalDb()).marquee;
  }
  saveMarquee(m: MarqueeSettings) {
    return mutateLocalDb((db) => void (db.marquee = m));
  }
  async testimonials() {
    return [...(await readLocalDb()).testimonials].sort((a, b) => a.sort - b.sort);
  }
  saveTestimonial(t: AdminTestimonial) {
    return mutateLocalDb((db) => upsert(db.testimonials, t));
  }
  deleteTestimonial(id: string) {
    return mutateLocalDb((db) => void (db.testimonials = db.testimonials.filter((t) => t.id !== id)));
  }
  async customers() {
    return (await readLocalDb()).users.map((u) => ({ id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, role: u.role, createdAt: u.createdAt }));
  }
  async subscribers() {
    return (await readLocalDb()).newsletter.map((n) => ({ ...n, unsubscribed: false }));
  }
}

function upsert<T extends { id: string }>(list: T[], item: T) {
  const i = list.findIndex((x) => x.id === item.id);
  if (i >= 0) list[i] = item;
  else list.push(item);
}

let store: CatalogAdminStore | null | undefined;

export function catalogAdminStore(): CatalogAdminStore | null {
  if (store !== undefined) return store;
  const db = serviceSupabase();
  store = db ? new SupabaseCatalogAdmin(db) : localWrites() ? new LocalCatalogAdmin() : null;
  return store;
}

export const PAYMENT_METHOD_ORDER: PaymentMethodId[] = ["paysera", "bank_transfer", "cash_agency", "wise"];

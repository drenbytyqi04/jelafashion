"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { adminOrNull } from "@/lib/auth/viewer";
import { catalogAdminStore, type MediaBucket } from "@/lib/admin/catalog-store";
import type { AdminProduct } from "@/lib/catalog/admin-types";
import { CATALOG_TAG } from "@/lib/catalog/repository";
import { SIZES } from "@/lib/catalog/types";
import { PAYMENT_METHOD_IDS } from "@/lib/commerce/types";
import { uploadTicket, type UploadTicket } from "@/lib/storage/signed-upload";
import { EXTENSIONS, sniffFile } from "@/lib/storage/sniff";

export type AdminResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const UUIDISH = z.string().min(1).max(64);
const bilingual = (max: number, required = false) =>
  z.object({ sq: required ? z.string().trim().min(1, "Plotëso versionin shqip.").max(max) : z.string().trim().max(max), en: z.string().trim().max(max) });

/** Every admin mutation: checks the role, runs, refreshes the shop's cached catalog. */
async function mutate<T>(fn: () => Promise<T>, paths: string[] = []): Promise<AdminResult<T>> {
  if (!(await adminOrNull())) return { ok: false, error: "Nuk ke qasje." };
  try {
    const data = await fn();
    updateTag(CATALOG_TAG);
    for (const p of paths) revalidatePath(p);
    return { ok: true, data };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: err.issues[0]?.message ?? "Të dhëna të pavlefshme." };
    if (err instanceof UserError) return { ok: false, error: err.message };
    console.error("[admin]", err);
    return { ok: false, error: "Ndryshimet nuk u ruajtën. Provo sërish." };
  }
}

class UserError extends Error {}

const store = () => {
  const s = catalogAdminStore();
  if (!s) throw new UserError("Paneli nuk është i lidhur me databazën.");
  return s;
};

// Products -----------------------------------------------------------------------------

const productSchema = z
  .object({
    id: UUIDISH.optional(),
    slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/, "Slug: vetëm shkronja të vogla latine, numra dhe viza."),
    category: z.enum(["bridal", "evening", "short"]),
    name: bilingual(120, true),
    description: bilingual(4000),
    fabricCare: bilingual(2000),
    priceCents: z.number().int().positive("Çmimi duhet të jetë më i madh se zero.").max(10_000_000),
    availability: z.enum(["in_stock", "made_to_order"]),
    productionWeeks: z.number().int().min(1).max(52).nullable(),
    length: z.enum(["mini", "knee", "midi", "floor"]),
    sleeves: z.enum(["sleeveless", "short", "long"]),
    silhouette: z.string().trim().max(40).nullable(),
    featured: z.boolean(),
    published: z.boolean(),
    seoTitle: bilingual(70),
    seoDescription: bilingual(170),
    colors: z
      .array(z.object({ id: UUIDISH, name: bilingual(60, true), hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Ngjyra duhet të jetë në formatin #RRGGBB."), family: z.string().trim().min(1).max(30) }))
      .max(12),
    images: z
      .array(
        z.object({
          id: UUIDISH,
          path: z.string().min(1).max(300),
          alt: bilingual(200),
          width: z.number().int().positive().nullable(),
          height: z.number().int().positive().nullable(),
          colorId: UUIDISH.nullable(),
        }),
      )
      .max(20),
    sizes: z.array(z.object({ size: z.enum(SIZES as ["XS", "S", "M", "L", "XL", "XXL"]), stock: z.number().int().min(0).max(999) })).max(6),
    measurements: z.array(z.string().max(40)).max(30),
  })
  .refine((p) => p.availability === "in_stock" || p.productionWeeks !== null, { message: "Shkruaj javët e punës për fustanet me porosi.", path: ["productionWeeks"] });

export async function saveProduct(input: unknown): Promise<AdminResult<{ id: string }>> {
  return mutate(async () => {
    const p = productSchema.parse(input);
    const s = store();
    const all = await s.products();
    if (all.some((x) => x.slug === p.slug && x.id !== p.id)) throw new UserError("Ky slug përdoret nga një produkt tjetër.");
    const existing = p.id ? all.find((x) => x.id === p.id) : undefined;
    const now = new Date().toISOString();
    const colorIds = new Set(p.colors.map((c) => c.id));
    const product: AdminProduct = {
      ...p,
      id: existing?.id ?? randomUUID(),
      // First publication dates "New in"; unpublishing and republishing keeps it.
      publishedAt: existing?.publishedAt ?? (p.published ? now : null),
      images: p.images.map((i) => ({ ...i, url: null, colorId: i.colorId && colorIds.has(i.colorId) ? i.colorId : null })),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const saved = await s.saveProduct(product);
    return { id: saved.id };
  }, ["/admin/products"]);
}

export async function deleteProduct(id: unknown) {
  return mutate(async () => store().deleteProduct(UUIDISH.parse(id)), ["/admin/products"]);
}

// Media --------------------------------------------------------------------------------

const MEDIA_TYPES: Record<MediaBucket, string[]> = {
  "product-images": ["image/jpeg", "image/png", "image/webp", "image/avif"],
  "site-media": ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"],
};
const MEDIA_LIMIT: Record<MediaBucket, number> = { "product-images": 10 * 1024 * 1024, "site-media": 50 * 1024 * 1024 };
const mediaSchema = z.object({ bucket: z.enum(["product-images", "site-media"]), folder: z.string().regex(/^[a-z0-9-]{1,64}$/), contentType: z.string(), size: z.number().int().positive() });

/** Step 1: a signed URL (production) or "direct" (local development). */
export async function startMediaUpload(input: unknown): Promise<AdminResult<{ ticket: UploadTicket; url: string | null }>> {
  return mutate(async () => {
    const m = mediaSchema.parse(input);
    if (!MEDIA_TYPES[m.bucket].includes(m.contentType)) throw new UserError("Ky lloj skedari nuk pranohet.");
    if (m.size > MEDIA_LIMIT[m.bucket]) throw new UserError(`Skedari është më i madh se ${MEDIA_LIMIT[m.bucket] / 1024 / 1024} MB.`);
    const path = `${m.folder}/${randomUUID()}.${EXTENSIONS[m.contentType]}`;
    const ticket = await uploadTicket(m.bucket, path);
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return { ticket, url: ticket.mode === "signed" && base ? `${base}/storage/v1/object/public/${m.bucket}/${ticket.path}` : null };
  });
}

/** Local development: the file comes through the action. */
export async function uploadMediaDirect(formData: FormData): Promise<AdminResult<{ path: string; url: string }>> {
  return mutate(async () => {
    const m = mediaSchema.omit({ contentType: true, size: true }).parse({ bucket: formData.get("bucket"), folder: formData.get("folder") });
    const file = formData.get("file");
    if (!(file instanceof File)) throw new UserError("Zgjidh një skedar.");
    if (file.size > MEDIA_LIMIT[m.bucket]) throw new UserError("Skedari është shumë i madh.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffFile(bytes);
    if (!kind || !MEDIA_TYPES[m.bucket].includes(kind.contentType)) throw new UserError("Ky lloj skedari nuk pranohet.");
    return store().upload(m.bucket, bytes, kind.contentType, kind.extension, m.folder);
  });
}

// Collections ----------------------------------------------------------------------------

const collectionSchema = z.object({
  id: UUIDISH.optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/, "Slug: vetëm shkronja të vogla latine, numra dhe viza."),
  name: bilingual(120, true),
  description: bilingual(1000),
  published: z.boolean(),
  sort: z.number().int().min(0).max(999),
  productIds: z.array(UUIDISH).max(200),
});

export async function saveCollection(input: unknown) {
  return mutate(async () => {
    const c = collectionSchema.parse(input);
    const s = store();
    if ((await s.collections()).some((x) => x.slug === c.slug && x.id !== c.id)) throw new UserError("Ky slug përdoret nga një koleksion tjetër.");
    await s.saveCollection({ ...c, id: c.id ?? randomUUID() });
  }, ["/admin/collections"]);
}

export async function deleteCollection(id: unknown) {
  return mutate(async () => store().deleteCollection(UUIDISH.parse(id)), ["/admin/collections"]);
}

// Discounts ------------------------------------------------------------------------------

const discountSchema = z
  .object({
    id: UUIDISH.optional(),
    code: z.string().trim().regex(/^[A-Za-z0-9_-]{3,32}$/, "Kodi: 3–32 shkronja, numra, - ose _."),
    kind: z.enum(["percent", "fixed"]),
    value: z.number().int().positive("Vlera duhet të jetë më e madhe se zero."),
    minSubtotalCents: z.number().int().min(0),
    startsAt: z.string().datetime().nullable(),
    expiresAt: z.string().datetime().nullable(),
    usageLimit: z.number().int().positive().nullable(),
    active: z.boolean(),
  })
  .refine((d) => d.kind === "fixed" || d.value <= 100, { message: "Përqindja nuk mund të jetë mbi 100.", path: ["value"] });

export async function saveDiscount(input: unknown) {
  return mutate(async () => {
    const d = discountSchema.parse(input);
    const s = store();
    const all = await s.discounts();
    if (all.some((x) => x.code.toLowerCase() === d.code.toLowerCase() && x.id !== d.id)) throw new UserError("Ky kod ekziston tashmë.");
    const existing = all.find((x) => x.id === d.id);
    await s.saveDiscount({ ...d, code: d.code.toUpperCase(), id: d.id ?? randomUUID(), usedCount: existing?.usedCount ?? 0, createdAt: existing?.createdAt ?? new Date().toISOString() });
  }, ["/admin/discounts"]);
}

export async function deleteDiscount(id: unknown) {
  return mutate(async () => store().deleteDiscount(UUIDISH.parse(id)), ["/admin/discounts"]);
}

// Shipping -------------------------------------------------------------------------------

const zoneSchema = z.object({
  id: UUIDISH.optional(),
  name: bilingual(80, true),
  countries: z.array(z.string().regex(/^[A-Z]{2}$/, "Kodet e shteteve: dy shkronja, p.sh. XK, DE.")).max(250),
  isFallback: z.boolean(),
  sort: z.number().int().min(0).max(999),
  rates: z
    .array(
      z
        .object({
          id: UUIDISH.optional(),
          name: bilingual(80, true),
          priceCents: z.number().int().min(0),
          freeOverCents: z.number().int().positive().nullable(),
          minDays: z.number().int().min(1).max(120),
          maxDays: z.number().int().min(1).max(120),
        })
        .refine((r) => r.maxDays >= r.minDays, { message: "Ditët maksimale nuk mund të jenë më pak se minimalet.", path: ["maxDays"] }),
    )
    .min(1, "Shto të paktën një tarifë.")
    .max(10),
});

export async function saveZone(input: unknown) {
  return mutate(async () => {
    const z0 = zoneSchema.parse(input);
    if (!z0.isFallback && z0.countries.length === 0) throw new UserError("Shto të paktën një shtet, ose bëje zonë për pjesën tjetër të botës.");
    await store().saveZone({ ...z0, id: z0.id ?? randomUUID(), rates: z0.rates.map((r) => ({ ...r, id: r.id ?? randomUUID() })) });
  }, ["/admin/shipping"]);
}

export async function deleteZone(id: unknown) {
  return mutate(async () => store().deleteZone(UUIDISH.parse(id)), ["/admin/shipping"]);
}

// Payment methods ------------------------------------------------------------------------

const methodSchema = z.object({
  id: z.enum(PAYMENT_METHOD_IDS),
  enabled: z.boolean(),
  sort: z.number().int().min(0).max(99),
  details: z.record(z.string().max(40), z.union([z.string().trim().max(200), z.array(z.string().trim().max(60)).max(10)])),
});

export async function savePaymentMethod(input: unknown) {
  return mutate(async () => {
    const m = methodSchema.parse(input);
    await store().savePaymentMethod(m as Parameters<ReturnType<typeof store>["savePaymentMethod"]>[0]);
  }, ["/admin/payments"]);
}

// Homepage -------------------------------------------------------------------------------

const heroSchema = z.object({
  videoPath: z.string().max(300).nullable(),
  posterPath: z.string().max(300).nullable(),
  headline: z.object({ sq: z.array(z.string().trim().min(1).max(60)).min(1).max(3), en: z.array(z.string().trim().min(1).max(60)).min(1).max(3) }),
  subtitle: bilingual(300, true),
});
const marqueeSchema = z.object({ sq: z.array(z.string().trim().min(1).max(60)).max(8), en: z.array(z.string().trim().min(1).max(60)).max(8) });
const testimonialSchema = z.object({
  id: UUIDISH.optional(),
  quote: bilingual(600, true),
  author: z.string().trim().min(1).max(80),
  location: z.string().trim().max(80).nullable(),
  published: z.boolean(),
  sort: z.number().int().min(0).max(999),
});

export async function saveHomepage(input: unknown) {
  return mutate(async () => {
    const v = z.object({ hero: heroSchema, marquee: marqueeSchema }).parse(input);
    await Promise.all([store().saveHero(v.hero), store().saveMarquee(v.marquee)]);
  }, ["/admin/homepage"]);
}

export async function saveTestimonial(input: unknown) {
  return mutate(async () => {
    const t = testimonialSchema.parse(input);
    await store().saveTestimonial({ ...t, id: t.id ?? randomUUID() });
  }, ["/admin/homepage"]);
}

export async function deleteTestimonial(id: unknown) {
  return mutate(async () => store().deleteTestimonial(UUIDISH.parse(id)), ["/admin/homepage"]);
}

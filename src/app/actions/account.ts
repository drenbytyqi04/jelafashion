"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { MeasurementProfile, SavedAddress } from "@/lib/account/types";
import { accountStore } from "@/lib/account/store";
import { getViewer } from "@/lib/auth/viewer";
import { getMeasurementDefinitions } from "@/lib/catalog/repository";
import { addressSchema } from "@/lib/validation/checkout";

export type AccountResult<T = undefined> = { ok: true; data: T } | { ok: false; error: "auth" | "invalid" | "failure" };

async function context() {
  const viewer = await getViewer();
  const store = viewer ? await accountStore() : null;
  return viewer && store ? { viewer, store } : null;
}

async function run<T>(fn: (ctx: NonNullable<Awaited<ReturnType<typeof context>>>) => Promise<T>): Promise<AccountResult<T>> {
  const ctx = await context();
  if (!ctx) return { ok: false, error: "auth" };
  try {
    const data = await fn(ctx);
    revalidatePath("/[locale]/account", "layout");
    return { ok: true, data };
  } catch (err) {
    if (err instanceof z.ZodError) return { ok: false, error: "invalid" };
    console.error("[account]", err);
    return { ok: false, error: "failure" };
  }
}

const profileSchema = z.object({
  fullName: z.string().trim().max(120).transform((v) => v || null),
  phone: z.string().trim().max(30).transform((v) => v || null),
  locale: z.enum(["sq", "en"]),
});

export async function updateProfile(input: unknown) {
  return run(async ({ viewer, store }) => store.updateProfile(viewer.id, profileSchema.parse(input)));
}

const savedAddressSchema = addressSchema.extend({
  id: z.string().max(64).optional(),
  phone: z.string().trim().max(30).optional().transform((v) => v || null),
  isDefault: z.boolean(),
});

export async function saveAddress(input: unknown): Promise<AccountResult<SavedAddress>> {
  return run(({ viewer, store }) => store.saveAddress(viewer.id, savedAddressSchema.parse(input)));
}

export async function deleteAddress(id: unknown) {
  return run(({ viewer, store }) => store.deleteAddress(viewer.id, z.string().max(64).parse(id)));
}

const measurementProfileSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().trim().min(1).max(60),
  unit: z.enum(["cm", "in"]),
  measurements: z.record(z.string().max(40), z.number().nonnegative().max(400)),
  notes: z.string().trim().max(1000).optional().transform((v) => v || null),
});

export async function saveMeasurementProfile(input: unknown): Promise<AccountResult<MeasurementProfile>> {
  return run(async ({ viewer, store }) => {
    const profile = measurementProfileSchema.parse(input);
    // Only known measurements, each within the wizard's realistic range.
    const defs = new Map((await getMeasurementDefinitions()).map((d) => [d.id, d]));
    const measurements: Record<string, number> = {};
    for (const [id, cm] of Object.entries(profile.measurements)) {
      const d = defs.get(id);
      if (!d || cm < d.minCm - 0.05 || cm > d.maxCm + 0.05) throw new z.ZodError([]);
      measurements[id] = Math.round(cm * 10) / 10;
    }
    if (Object.keys(measurements).length === 0) throw new z.ZodError([]);
    return store.saveMeasurementProfile(viewer.id, { ...profile, measurements });
  });
}

export async function deleteMeasurementProfile(id: unknown) {
  return run(({ viewer, store }) => store.deleteMeasurementProfile(viewer.id, z.string().max(64).parse(id)));
}

/** For the measurement wizard: null when signed out, so it can offer saving instead. */
export async function myMeasurementProfiles(): Promise<MeasurementProfile[] | null> {
  const ctx = await context();
  if (!ctx) return null;
  try {
    return await ctx.store.measurementProfiles(ctx.viewer.id);
  } catch (err) {
    console.error("[account] profiles", err);
    return [];
  }
}

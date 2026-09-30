import "server-only";
import { unstable_cache } from "next/cache";
import * as seed from "@/lib/catalog/seed-data";
import { CATALOG_TAG } from "@/lib/catalog/repository";
import { localCatalog, readLocalDb } from "@/lib/local-db";
import { publicSupabase } from "@/lib/supabase/public-client";
import { payseraConfigured, payseraSandbox } from "@/lib/payments/paysera";
import type { PaymentMethodConfig, ShippingZone } from "./types";

// Shipping zones and payment details are public (shown at checkout) and change rarely, so
// they are cached with the catalog and refreshed when the admin saves.

export const getShippingZones = unstable_cache(
  async (): Promise<ShippingZone[]> => {
    if (localCatalog()) {
      return (await readLocalDb()).shippingZones
        .sort((a, b) => a.sort - b.sort)
        .map((z) => ({ id: z.id, name: z.name, countries: z.countries, isFallback: z.isFallback, rates: z.rates }));
    }
    const db = publicSupabase();
    if (!db) {
      return seed.shippingZones.map((z, i) => ({
        id: `zone-${i}`,
        name: z.name,
        countries: z.countries,
        isFallback: z.isFallback,
        rates: z.rates.map((r, j) => ({
          id: `rate-${i}-${j}`,
          name: r.name,
          priceCents: Math.round(r.priceEUR * 100),
          freeOverCents: r.freeOverEUR === null ? null : Math.round(r.freeOverEUR * 100),
          minDays: r.minDays,
          maxDays: r.maxDays,
        })),
      }));
    }
    const { data, error } = await db
      .from("shipping_zones")
      .select("id, name_sq, name_en, countries, is_fallback, sort, shipping_rates (id, name_sq, name_en, price_cents, free_over_cents, min_days, max_days, active, sort)")
      .order("sort");
    if (error) throw new Error(`Shipping zones query failed: ${error.message}`);
    type RateRow = { id: string; name_sq: string; name_en: string; price_cents: number; free_over_cents: number | null; min_days: number; max_days: number; active: boolean; sort: number };
    return data.map((z) => ({
      id: z.id,
      name: { sq: z.name_sq, en: z.name_en },
      countries: z.countries,
      isFallback: z.is_fallback,
      rates: (z.shipping_rates as RateRow[])
        .filter((r) => r.active)
        .sort((a, b) => a.sort - b.sort)
        .map((r) => ({
          id: r.id,
          name: { sq: r.name_sq, en: r.name_en },
          priceCents: r.price_cents,
          freeOverCents: r.free_over_cents,
          minDays: r.min_days,
          maxDays: r.max_days,
        })),
    }));
  },
  ["shipping-zones"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

const getStoredPaymentMethods = unstable_cache(
  async (): Promise<PaymentMethodConfig[]> => {
    if (localCatalog()) {
      return (await readLocalDb()).paymentMethods
        .filter((m) => m.enabled)
        .sort((a, b) => a.sort - b.sort)
        .map((m) => ({ id: m.id, details: m.details }) as PaymentMethodConfig);
    }
    const db = publicSupabase();
    if (!db) return seed.paymentMethods as PaymentMethodConfig[];
    const { data, error } = await db.from("payment_methods").select("id, details, sort").eq("enabled", true).order("sort");
    if (error) throw new Error(`Payment methods query failed: ${error.message}`);
    return data as PaymentMethodConfig[];
  },
  ["payment-methods"],
  { tags: [CATALOG_TAG], revalidate: 300 },
);

/** Enabled methods; card payment only once Paysera is configured (or its local sandbox in dev). */
export async function getPaymentMethods(): Promise<PaymentMethodConfig[]> {
  const methods = await getStoredPaymentMethods();
  return methods.filter((m) => m.id !== "paysera" || payseraConfigured() || payseraSandbox());
}

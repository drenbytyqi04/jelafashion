import type { Discount, ShippingRate, ShippingZone } from "./types";

// Pure pricing, shared by the checkout page (live totals) and the server (the only totals
// that count). All amounts are integer cents in EUR.

export function zoneForCountry(zones: ShippingZone[], country: string): ShippingZone | null {
  return zones.find((z) => z.countries.includes(country)) ?? zones.find((z) => z.isFallback) ?? null;
}

export function discountAmount(subtotalCents: number, discount: Discount | null): number {
  if (!discount || subtotalCents < discount.minSubtotalCents) return 0;
  const amount = discount.kind === "percent" ? Math.round((subtotalCents * discount.value) / 100) : discount.value;
  return Math.min(amount, subtotalCents);
}

export function shippingAmount(rate: ShippingRate, subtotalCents: number): number {
  return rate.freeOverCents !== null && subtotalCents >= rate.freeOverCents ? 0 : rate.priceCents;
}

export function orderTotals(subtotalCents: number, discount: Discount | null, rate: ShippingRate | null) {
  const discountCents = discountAmount(subtotalCents, discount);
  const shippingCents = rate ? shippingAmount(rate, subtotalCents - discountCents) : 0;
  return { subtotalCents, discountCents, shippingCents, totalCents: subtotalCents - discountCents + shippingCents };
}

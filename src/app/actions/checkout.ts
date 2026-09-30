"use server";

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js/min";
import { after } from "next/server";
import { getLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { getCatalog, getMeasurementDefinitions } from "@/lib/catalog/repository";
import type { Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { getPaymentMethods, getShippingZones } from "@/lib/commerce/config";
import { orderStore } from "@/lib/commerce/order-store";
import { orderTotals, zoneForCountry } from "@/lib/commerce/pricing";
import type { Discount, NewOrder, OrderItem } from "@/lib/commerce/types";
import { sendOrderConfirmation, sendShopNewOrder } from "@/lib/email/notifications";
import { isOffline, paymentProvider } from "@/lib/payments/providers";
import { siteOrigin } from "@/lib/site-origin";
import { addressSchema, cartLinesSchema, checkoutSchema } from "@/lib/validation/checkout";

export type DiscountResult = { ok: true; discount: Discount } | { ok: false; error: "discountInvalid" | "unavailable" };

/** Checks a code for the live summary. Only placeOrder redeems it. */
export async function checkDiscount(code: unknown): Promise<DiscountResult> {
  if (typeof code !== "string" || !/^[A-Za-z0-9_-]{3,32}$/.test(code.trim())) return { ok: false, error: "discountInvalid" };
  const store = orderStore();
  if (!store) return { ok: false, error: "unavailable" };
  const discount = await store.findDiscount(code.trim());
  return discount ? { ok: true, discount } : { ok: false, error: "discountInvalid" };
}

export type CartChange = { key: string; priceEUR?: number; quantity?: number; removed?: true };

export type PlaceOrderResult =
  | { ok: true; redirect: string; external: boolean }
  | {
      ok: false;
      error: "invalid" | "cartChanged" | "discountExpired" | "shipping" | "paymentMethod" | "unavailable" | "failure";
      changes?: CartChange[];
    };

/**
 * The only place an order is priced. Everything from the browser is treated as a wish:
 * prices, sizes, stock, measurements, shipping and the discount are all recomputed here.
 */
export async function placeOrder(input: { values: unknown; lines: unknown }): Promise<PlaceOrderResult> {
  const values = checkoutSchema.safeParse(input?.values);
  const lines = cartLinesSchema.safeParse(input?.lines);
  if (!values.success || !lines.success) return { ok: false, error: "invalid" };
  const v = values.data;
  const locale = (await getLocale()) as Locale;

  const store = orderStore();
  if (!store) return { ok: false, error: "unavailable" };

  try {
    const [catalog, definitions, zones, methods] = await Promise.all([
      getCatalog(),
      getMeasurementDefinitions(),
      getShippingZones(),
      getPaymentMethods(),
    ]);

    // 1. Lines against the catalog
    const changes: CartChange[] = [];
    const items: OrderItem[] = [];
    for (const line of lines.data) {
      const product = catalog.find((p) => p.slug === line.slug && (p.id === line.productId || p.slug === line.productId));
      if (!product) {
        changes.push({ key: line.key, removed: true });
        continue;
      }
      const priceEUR = product.priceCents / 100;
      if (Math.round(line.priceEUR * 100) !== product.priceCents) changes.push({ key: line.key, priceEUR });

      let quantity = line.quantity;
      let measurements: OrderItem["measurements"] = null;
      if (line.size === "custom") {
        const required = definitions.filter((d) => d.alwaysRequired || product.measurements.includes(d.id));
        const given = new Map((line.measurements ?? []).map((m) => [m.id, m.cm]));
        // Out-of-range values are allowed after the wizard's soft warning, within reason.
        const valid = required.every((d) => {
          const cm = given.get(d.id);
          return cm !== undefined && cm >= d.minCm * 0.5 && cm <= d.maxCm * 1.5;
        });
        if (!valid) {
          changes.push({ key: line.key, removed: true });
          continue;
        }
        measurements = required.map((d) => ({ id: d.id, cm: Math.round(given.get(d.id)! * 10) / 10, label: d.label }));
      } else {
        const size = product.sizes.find((s) => s.size === line.size);
        const stock = size?.stock ?? 0;
        if (!size || (product.availability === "in_stock" && stock === 0)) {
          changes.push({ key: line.key, removed: true });
          continue;
        }
        if (product.availability === "in_stock" && quantity > stock) {
          quantity = stock;
          changes.push({ key: line.key, quantity });
        }
      }
      const color = line.colorHex ? product.colors.find((c) => c.hex.toLowerCase() === line.colorHex!.toLowerCase()) : undefined;
      items.push({
        productId: product.id,
        productSlug: product.slug,
        name: pick(product.name, locale),
        color: color ? pick(color.name, locale) : null,
        size: line.size,
        quantity,
        unitPriceCents: product.priceCents,
        measurements,
        measurementUnit: measurements ? (line.unit ?? "cm") : null,
        notes: measurements && line.notes?.trim() ? line.notes.trim().slice(0, 1000) : null,
      });
    }
    if (changes.length) return { ok: false, error: "cartChanged", changes };

    // 2. Shipping, payment method, discount
    const zone = zoneForCountry(zones, v.shipping.country);
    const rate = zone?.rates.find((r) => r.id === v.shippingRateId);
    if (!rate) return { ok: false, error: "shipping" };
    if (!methods.some((m) => m.id === v.paymentMethod)) return { ok: false, error: "paymentMethod" };

    let discount: Discount | null = null;
    if (v.discountCode) {
      discount = await store.findDiscount(v.discountCode);
      if (!discount) return { ok: false, error: "discountExpired" };
    }
    const subtotal = items.reduce((n, i) => n + i.unitPriceCents * i.quantity, 0);
    const totals = orderTotals(subtotal, discount, rate);
    if (discount && totals.discountCents > 0 && !(await store.redeemDiscount(discount.code))) {
      return { ok: false, error: "discountExpired" };
    }

    // 3. Store
    const phone = parsePhoneNumberFromString(v.phone, v.phoneCountry as CountryCode);
    const newOrder: NewOrder = {
      email: v.email.toLowerCase(),
      phone: phone?.number ?? v.phone,
      locale,
      marketingOptIn: v.marketing,
      paymentMethod: v.paymentMethod,
      ...totals,
      discountCode: discount && totals.discountCents > 0 ? discount.code : null,
      shippingRateId: rate.id,
      shippingMethod: { name: rate.name, minDays: rate.minDays, maxDays: rate.maxDays },
      shippingAddress: v.shipping,
      billingAddress: v.billingSame ? null : addressSchema.parse(v.billing),
      customerNote: v.note ?? null,
      items,
    };
    const order = await store.create(newOrder);

    // 4. Payment
    const origin = await siteOrigin();
    const confirmationPath = getPathname({ locale, href: { pathname: "/order/[token]", params: { token: order.accessToken } } });
    const start = paymentProvider(order.paymentMethod).start(order, origin, confirmationPath);

    if (isOffline(order.paymentMethod)) {
      after(async () => {
        await Promise.all([sendOrderConfirmation(order, origin), sendShopNewOrder(order, origin)]);
      });
    }
    return start.kind === "redirect"
      ? { ok: true, redirect: start.url, external: true }
      : { ok: true, redirect: confirmationPath, external: false };
  } catch (err) {
    console.error("[checkout] placeOrder failed", err);
    return { ok: false, error: "failure" };
  }
}

/** From the confirmation page after a cancelled or abandoned card payment. */
export async function retryCardPayment(token: unknown): Promise<{ ok: true; redirect: string } | { ok: false }> {
  const store = orderStore();
  if (!store || typeof token !== "string") return { ok: false };
  const order = await store.getByToken(token);
  if (!order || order.paymentMethod !== "paysera" || order.status !== "awaiting_payment") return { ok: false };
  const origin = await siteOrigin();
  const path = getPathname({ locale: order.locale, href: { pathname: "/order/[token]", params: { token: order.accessToken } } });
  const start = paymentProvider("paysera").start(order, origin, path);
  return start.kind === "redirect" ? { ok: true, redirect: start.url } : { ok: false };
}

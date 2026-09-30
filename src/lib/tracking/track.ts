"use client";

import { useConsentStore } from "@/stores/consent";

// One call per business event, mapped to GA4, Meta Pixel and TikTok. Nothing is sent
// unless the visitor consented to that category (analytics → GA4, marketing → Meta and
// TikTok) and the tag is configured; the loaders define the queues, so events fired while
// a script is still downloading are kept.

export type TrackItem = { id: string; name: string; price: number; quantity: number; category?: string; variant?: string };

export type TrackEvent =
  | { name: "view_item"; item: TrackItem }
  | { name: "add_to_cart"; item: TrackItem }
  | { name: "add_to_wishlist"; item: TrackItem }
  | { name: "begin_checkout"; items: TrackItem[]; value: number }
  | { name: "purchase"; orderNumber: string; items: TrackItem[]; value: number; shipping: number; eventId: string }
  | { name: "lead"; source: "newsletter" | "contact" };

type Fn = (...args: unknown[]) => void;
type TtqLike = { track: Fn; page: Fn };
declare global {
  interface Window {
    gtag?: Fn;
    fbq?: Fn;
    ttq?: TtqLike;
  }
}

const CURRENCY = "EUR";
const round = (n: number) => Math.round(n * 100) / 100;

const ga4Items = (items: TrackItem[]) =>
  items.map((i) => ({ item_id: i.id, item_name: i.name, price: round(i.price), quantity: i.quantity, item_category: i.category, item_variant: i.variant }));
const metaContents = (items: TrackItem[]) => ({
  content_ids: items.map((i) => i.id),
  contents: items.map((i) => ({ id: i.id, quantity: i.quantity, item_price: round(i.price) })),
  content_type: "product",
  num_items: items.reduce((n, i) => n + i.quantity, 0),
});
const tiktokContents = (items: TrackItem[]) => ({
  contents: items.map((i) => ({ content_id: i.id, content_name: i.name, content_type: "product", price: round(i.price), quantity: i.quantity })),
});
const total = (items: TrackItem[]) => round(items.reduce((n, i) => n + i.price * i.quantity, 0));

// Events fired before the saved consent is read and the tags are set up (e.g. the checkout
// view on a fresh page load) wait here, and are sent or dropped once consent is known.
const pending: TrackEvent[] = [];
let ready = false;

/** Called by the tag loader once consent is known and the allowed tags are defined. */
export function markTrackingReady() {
  ready = true;
  for (const e of pending.splice(0)) send(e);
}

export function track(e: TrackEvent) {
  if (typeof window === "undefined") return;
  if (!ready) {
    if (pending.length < 30) pending.push(e);
    return;
  }
  send(e);
}

function send(e: TrackEvent) {
  const { analytics, marketing } = useConsentStore.getState();
  const gtag = analytics ? window.gtag : undefined;
  const fbq = marketing ? window.fbq : undefined;
  const ttq = marketing ? window.ttq : undefined;

  switch (e.name) {
    case "view_item":
    case "add_to_cart":
    case "add_to_wishlist": {
      const items = [e.item];
      const value = total(items);
      gtag?.("event", e.name, { currency: CURRENCY, value, items: ga4Items(items) });
      const meta = { view_item: "ViewContent", add_to_cart: "AddToCart", add_to_wishlist: "AddToWishlist" }[e.name];
      fbq?.("track", meta, { ...metaContents(items), value, currency: CURRENCY });
      ttq?.track(meta, { ...tiktokContents(items), value, currency: CURRENCY });
      break;
    }
    case "begin_checkout":
      gtag?.("event", "begin_checkout", { currency: CURRENCY, value: round(e.value), items: ga4Items(e.items) });
      fbq?.("track", "InitiateCheckout", { ...metaContents(e.items), value: round(e.value), currency: CURRENCY });
      ttq?.track("InitiateCheckout", { ...tiktokContents(e.items), value: round(e.value), currency: CURRENCY });
      break;
    case "purchase":
      gtag?.("event", "purchase", { transaction_id: e.orderNumber, currency: CURRENCY, value: round(e.value), shipping: round(e.shipping), items: ga4Items(e.items) });
      // Same event id as the server (Conversions API): Meta counts the purchase once.
      fbq?.("track", "Purchase", { ...metaContents(e.items), value: round(e.value), currency: CURRENCY, order_id: e.orderNumber }, { eventID: e.eventId });
      ttq?.track("CompletePayment", { ...tiktokContents(e.items), value: round(e.value), currency: CURRENCY }, { event_id: e.eventId });
      break;
    case "lead":
      gtag?.("event", e.source === "newsletter" ? "sign_up" : "generate_lead", { method: e.source });
      fbq?.("track", e.source === "newsletter" ? "Lead" : "Contact");
      ttq?.track(e.source === "newsletter" ? "Subscribe" : "Contact");
      break;
  }
}

/** SPA navigation: one page view per route change, for the tags that are loaded. */
export function trackPageView(url: string) {
  if (typeof window === "undefined") return;
  const { analytics, marketing } = useConsentStore.getState();
  if (analytics) window.gtag?.("event", "page_view", { page_location: url, page_title: document.title });
  if (marketing) {
    window.fbq?.("track", "PageView");
    window.ttq?.page();
  }
}

/** The tracked shape of a dress: slug as id, so it's stable across catalogs and feeds. */
export function productItem(p: { slug: string; category: string; priceCents: number }, name: string, variant?: string, quantity = 1): TrackItem {
  return { id: p.slug, name, price: p.priceCents / 100, quantity, category: p.category, variant };
}

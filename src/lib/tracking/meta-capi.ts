import "server-only";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import type { Order } from "@/lib/commerce/types";
import { trackingIds } from "./ids";

// Meta Conversions API: the server-side twin of the browser Pixel's Purchase. Both carry
// the same event_id, so Meta counts one purchase even when the browser event is blocked.
// Personal data is normalised and SHA-256 hashed before it leaves the server.

const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? "v21.0";
const sha = (v: string | null | undefined) => (v ? createHash("sha256").update(v.trim().toLowerCase()).digest("hex") : undefined);

export const metaCapiEnabled = () => Boolean(trackingIds.metaPixel && process.env.META_CAPI_ACCESS_TOKEN);

export const purchaseEventId = (order: Pick<Order, "number">) => `purchase-${order.number}`;

export async function sendMetaPurchase(order: Order, eventSourceUrl: string): Promise<boolean> {
  if (!metaCapiEnabled()) return false;
  const [h, c] = await Promise.all([headers(), cookies()]);
  const address = order.billingAddress ?? order.shippingAddress;
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: purchaseEventId(order),
        action_source: "website",
        event_source_url: eventSourceUrl,
        user_data: {
          em: [sha(order.email)],
          ph: [sha(order.phone.replace(/\D/g, ""))],
          fn: [sha(address.firstName)],
          ln: [sha(address.lastName)],
          ct: [sha(address.city.replace(/\s+/g, ""))],
          zp: address.postalCode ? [sha(address.postalCode.replace(/\s+/g, ""))] : undefined,
          country: [sha(address.country)],
          external_id: [sha(order.email)],
          client_ip_address: h.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
          client_user_agent: h.get("user-agent") ?? undefined,
          fbp: c.get("_fbp")?.value,
          fbc: c.get("_fbc")?.value,
        },
        custom_data: {
          currency: "EUR",
          value: order.totalCents / 100,
          order_id: order.number,
          content_type: "product",
          content_ids: order.items.map((i) => i.productSlug),
          contents: order.items.map((i) => ({ id: i.productSlug, quantity: i.quantity, item_price: i.unitPriceCents / 100 })),
          num_items: order.items.reduce((n, i) => n + i.quantity, 0),
        },
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE && { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE }),
  };
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${trackingIds.metaPixel}/events?access_token=${encodeURIComponent(process.env.META_CAPI_ACCESS_TOKEN!)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) console.warn(`[capi] Purchase ${order.number} rejected: ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res.ok;
  } catch (err) {
    console.warn(`[capi] Purchase ${order.number} not sent`, err);
    return false;
  }
}

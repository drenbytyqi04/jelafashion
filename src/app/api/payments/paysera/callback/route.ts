import { type NextRequest } from "next/server";
import { orderStore } from "@/lib/commerce/order-store";
import { settlePaidOrder } from "@/lib/commerce/settle";
import { verifyPayseraCallback } from "@/lib/payments/paysera";
import { siteOrigin } from "@/lib/site-origin";

// Paysera calls this server to server after every payment attempt (GET or POST) and
// retries until it receives exactly "OK". An order becomes paid only here, never from the
// customer's return to the site.

const reply = (body: string, status = 200) => new Response(body, { status, headers: { "content-type": "text/plain" } });

async function handle(params: URLSearchParams) {
  const store = orderStore();
  if (!store) return reply("Error: store unavailable", 503);

  const result = verifyPayseraCallback({ data: params.get("data"), ss1: params.get("ss1"), ss2: params.get("ss2") });
  if (!result.ok) {
    await store.recordCallback(null, "paysera", { reason: result.reason, params: result.params ?? null }, false);
    console.warn("[paysera] rejected callback:", result.reason);
    return reply("Error", 400);
  }

  const order = await store.getById(result.orderId);
  await store.recordCallback(order?.id ?? null, "paysera", result.params, true);
  if (!order) return reply("Error: unknown order", 400);
  if (!result.paid) return reply("OK"); // pending or informational: nothing to change

  if (order.paymentMethod !== "paysera" || result.currency !== "EUR" || result.amountCents !== order.totalCents) {
    console.error(`[paysera] amount/currency mismatch on ${order.number}: ${result.amountCents} ${result.currency}`);
    return reply("Error: amount mismatch", 400);
  }
  await settlePaidOrder(store, order, result.requestId, result.test ? "Paysera (test mode)" : "Paysera", await siteOrigin());
  return reply("OK");
}

export async function GET(request: NextRequest) {
  return handle(request.nextUrl.searchParams);
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const params = new URLSearchParams(request.nextUrl.searchParams);
  form?.forEach((value, key) => typeof value === "string" && params.set(key, value));
  return handle(params);
}

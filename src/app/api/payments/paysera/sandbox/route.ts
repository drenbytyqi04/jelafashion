import { type NextRequest } from "next/server";
import { orderStore } from "@/lib/commerce/order-store";
import { settlePaidOrder } from "@/lib/commerce/settle";
import { formatPrice } from "@/lib/format";
import { orderUrl } from "@/lib/email/notifications";
import { payseraSandbox as enabled } from "@/lib/payments/paysera";
import { siteOrigin } from "@/lib/site-origin";

// Local stand-in for Paysera while PAYSERA_PROJECT_ID is not set: lets the whole card flow
// (redirect, verified payment, emails, confirmation) run on a laptop. Unreachable once
// Paysera is configured or in a real production deployment.

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

async function load(params: URLSearchParams) {
  const store = orderStore();
  const order = store ? await store.getById(params.get("order") ?? "") : null;
  return store && order && order.accessToken === params.get("token") ? { store, order } : null;
}

export async function GET(request: NextRequest) {
  if (!enabled()) return new Response("Not found", { status: 404 });
  const found = await load(request.nextUrl.searchParams);
  if (!found) return new Response("Unknown order", { status: 404 });
  const { order } = found;
  const hidden = `<input type="hidden" name="order" value="${escape(order.id)}"><input type="hidden" name="token" value="${escape(order.accessToken)}">`;
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Paysera sandbox</title>
<style>body{font:16px/1.5 system-ui,sans-serif;background:#f4f4f4;color:#222;margin:0;padding:48px 16px}main{max-width:420px;margin:auto;background:#fff;padding:32px;border:1px solid #ddd}
button{width:100%;min-height:48px;font:inherit;margin-top:12px;cursor:pointer;border:1px solid #222;background:#fff}button.pay{background:#222;color:#fff}small{color:#666}</style></head>
<body><main><p><small>Local sandbox · not the real Paysera</small></p><h1>Pay ${escape(formatPrice(order.totalCents, "en"))}</h1>
<p>Order ${escape(order.number)} · ${escape(order.email)}</p>
<form method="post">${hidden}<input type="hidden" name="outcome" value="paid"><button class="pay" type="submit">Simulate successful payment</button></form>
<form method="post">${hidden}<input type="hidden" name="outcome" value="cancel"><button type="submit">Cancel payment</button></form>
</main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

export async function POST(request: NextRequest) {
  if (!enabled()) return new Response("Not found", { status: 404 });
  const form = await request.formData();
  const params = new URLSearchParams();
  form.forEach((value, key) => typeof value === "string" && params.set(key, value));
  const found = await load(params);
  if (!found) return new Response("Unknown order", { status: 404 });
  const origin = await siteOrigin();
  const url = orderUrl(origin, found.order);
  if (params.get("outcome") === "paid") {
    await settlePaidOrder(found.store, found.order, `SANDBOX-${Date.now()}`, "Paysera sandbox (local)", origin);
    return Response.redirect(url, 303);
  }
  return Response.redirect(`${url}?payment=cancelled`, 303);
}

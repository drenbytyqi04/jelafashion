import { getViewer } from "@/lib/auth/viewer";
import { orderStore } from "@/lib/commerce/order-store";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/commerce/types";
import { countryName } from "@/lib/commerce/present";

// CSV of orders (current filter), one row per order, for accounting and couriers.
// Spreadsheet formula injection is neutralised by prefixing risky cells with a quote.
const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const eur = (cents: number) => (cents / 100).toFixed(2);

export async function GET(request: Request) {
  const viewer = await getViewer();
  if (viewer?.role !== "admin") return new Response("Not found", { status: 404 });
  const store = orderStore();
  if (!store) return new Response("Unavailable", { status: 503 });
  const url = new URL(request.url);
  const s = url.searchParams.get("status");
  const status = ORDER_STATUSES.includes(s as OrderStatus) ? (s as OrderStatus) : undefined;
  const { orders } = await store.list({ status, query: url.searchParams.get("q") ?? undefined, limit: 5000 });

  const head = ["number", "created_at", "status", "payment_method", "email", "phone", "first_name", "last_name", "address", "city", "postal_code", "country", "items", "custom_size", "subtotal_eur", "discount_eur", "shipping_eur", "total_eur", "discount_code", "paid_at", "payment_reference", "tracking_number"];
  const rows = orders.map((o) => [
    o.number,
    o.createdAt,
    o.status,
    o.paymentMethod,
    o.email,
    o.phone,
    o.shippingAddress.firstName,
    o.shippingAddress.lastName,
    [o.shippingAddress.line1, o.shippingAddress.line2].filter(Boolean).join(", "),
    o.shippingAddress.city,
    o.shippingAddress.postalCode ?? "",
    countryName(o.shippingAddress.country, "sq"),
    o.items.map((i) => `${i.quantity}× ${i.name} (${i.size === "custom" ? "me masa" : i.size}${i.color ? `, ${i.color}` : ""})`).join(" | "),
    o.items.some((i) => i.size === "custom") ? "po" : "jo",
    eur(o.subtotalCents),
    eur(o.discountCents),
    eur(o.shippingCents),
    eur(o.totalCents),
    o.discountCode ?? "",
    o.paidAt ?? "",
    o.paymentReference ?? "",
    o.trackingNumber ?? "",
  ]);
  // BOM so Excel opens UTF-8 (ë, ç) correctly.
  const csv = "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="porosite-${date}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}

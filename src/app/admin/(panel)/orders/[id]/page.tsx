import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/viewer";
import { orderStore } from "@/lib/commerce/order-store";
import { addressLines } from "@/lib/commerce/present";
import { formatDate, formatPrice } from "@/lib/format";
import { formatMeasure, toUnit } from "@/lib/units";
import { METHOD_LABELS, Unavailable } from "@/components/admin/shared";
import { OrderActions } from "@/components/admin/order-actions";
import { MarkSeen } from "@/components/admin/mark-seen";
import { Btn, PageHeader, Panel, STATUS_LABELS, StatusBadge } from "@/components/admin/ui";

export const metadata = { title: "Porosia" };

const time = (iso: string) => {
  const d = new Date(iso);
  return `${formatDate(iso, "sq")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
};

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const store = orderStore();
  if (!store) return <Unavailable />;
  const { id } = await params;
  const [order, events] = await Promise.all([store.getById(id), store.events(id)]);
  if (!order) notFound();
  const price = (c: number) => formatPrice(c, "sq");
  const hasCustom = order.items.some((i) => i.measurements);

  return (
    <>
      <MarkSeen orderId={order.id} seen={order.seenAt !== null} />
      <p className="mb-2 text-[0.8125rem]">
        <Link href="/admin/orders" className="text-stone hover:text-ink">
          ← Porositë
        </Link>
      </p>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="nums">{order.number}</span> <StatusBadge status={order.status} />
          </span>
        }
        description={`Bërë më ${time(order.createdAt)} · ${order.locale === "en" ? "Anglisht" : "Shqip"}`}
        actions={
          hasCustom && (
            <div className="flex flex-wrap gap-2">
              <Btn asChild>
                <a href={`/admin/print/${order.id}`} target="_blank" rel="noopener">
                  Fleta e masave (print)
                </a>
              </Btn>
              <Btn asChild>
                <a href={`/admin/print/${order.id}/pdf`} download>
                  Shkarko PDF
                </a>
              </Btn>
            </div>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Panel title="Veprimet">
            <OrderActions orderId={order.id} status={order.status} paymentMethod={order.paymentMethod} />
          </Panel>

          <Panel title="Artikujt">
            <ul className="flex flex-col divide-y divide-hairline">
              {order.items.map((item, i) => {
                const unit = item.measurementUnit ?? "cm";
                return (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-[0.8125rem] text-stone">
                          {[item.color, item.size === "custom" ? "Me masa" : `Masa ${item.size}`, `Sasia ${item.quantity}`].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <p className="nums">{price(item.unitPriceCents * item.quantity)}</p>
                    </div>
                    {item.measurements && (
                      <div className="mt-3 rounded-admin bg-linen p-3">
                        <p className="mb-2 text-[0.75rem] text-stone">Masat në cm{unit === "in" ? " (klientja i shkroi në inç)" : ""}</p>
                        <dl className="nums grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-[0.8125rem] xl:grid-cols-[1fr_auto_1fr_auto]">
                          {item.measurements.map((m) => (
                            <div key={m.id} className="contents">
                              <dt className="text-stone">{m.label?.sq ?? m.id}</dt>
                              <dd className="text-right">
                                {formatMeasure(m.cm, "sq")}
                                {unit === "in" && <span className="ml-1 text-stone">({formatMeasure(toUnit(m.cm, "in"), "sq")}″)</span>}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        {item.notes && <p className="mt-2 text-[0.8125rem]">Shënime: {item.notes}</p>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <dl className="nums mt-4 flex flex-col gap-1 border-t border-hairline pt-3 text-[0.8125rem]">
              <div className="flex justify-between">
                <dt className="text-stone">Nëntotali</dt>
                <dd>{price(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between">
                  <dt className="text-stone">Zbritja ({order.discountCode})</dt>
                  <dd>-{price(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-stone">Dërgesa · {order.shippingMethod.name.sq}</dt>
                <dd>{price(order.shippingCents)}</dd>
              </div>
              <div className="flex justify-between text-[0.9375rem] font-semibold">
                <dt>Totali</dt>
                <dd>{price(order.totalCents)}</dd>
              </div>
            </dl>
          </Panel>

          {order.customerNote && (
            <Panel title="Shënimi i klientes">
              <p className="whitespace-pre-line">{order.customerNote}</p>
            </Panel>
          )}

          <Panel title="Historiku">
            <ol className="flex flex-col gap-3">
              {events.map((e, i) => (
                <li key={i} className="grid grid-cols-[auto_1fr] gap-x-3">
                  <span aria-hidden className="mt-1.5 size-2 rounded-full bg-champagne" />
                  <div>
                    <p className="font-medium">{STATUS_LABELS[e.status as keyof typeof STATUS_LABELS] ?? e.status}</p>
                    <p className="text-[0.75rem] text-stone">
                      {time(e.createdAt)}
                      {e.note ? ` · ${e.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Klientja">
            <p className="font-medium">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p>
              <a href={`mailto:${order.email}`} className="underline-offset-4 hover:underline">
                {order.email}
              </a>
            </p>
            <p className="nums">
              <a href={`tel:${order.phone}`}>{order.phone}</a>
            </p>
            <p className="mt-2 text-[0.75rem] text-stone">
              {order.userId ? "Me llogari" : "Pa llogari"} · {order.marketingOptIn ? "Pranon newsletter-in" : "Pa newsletter"}
            </p>
          </Panel>
          <Panel title="Dërgesa">
            <address className="not-italic">
              {addressLines(order.shippingAddress, "sq").map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <p className="mt-2 text-[0.8125rem] text-stone">
              {order.shippingMethod.name.sq} · {order.shippingMethod.minDays}–{order.shippingMethod.maxDays} ditë pune
            </p>
            {order.trackingNumber && (
              <p className="nums mt-2 text-[0.8125rem]">
                Gjurmimi: {order.trackingCarrier ? `${order.trackingCarrier} · ` : ""}
                {order.trackingNumber}
              </p>
            )}
          </Panel>
          {order.billingAddress && (
            <Panel title="Faturimi">
              <address className="not-italic">
                {addressLines(order.billingAddress, "sq").map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </address>
            </Panel>
          )}
          <Panel title="Pagesa">
            <p>{METHOD_LABELS[order.paymentMethod]}</p>
            {order.paidAt && <p className="text-[0.8125rem] text-stone">Paguar më {time(order.paidAt)}</p>}
            {order.paymentReference && <p className="nums text-[0.8125rem] text-stone">Referenca: {order.paymentReference}</p>}
            {order.proofs.length > 0 && (
              <div className="mt-3 border-t border-hairline pt-3">
                <p className="mb-2 text-[0.8125rem] font-medium">Dëshmitë e pagesës</p>
                <ul className="flex flex-col gap-2">
                  {order.proofs.map((p, i) => (
                    <li key={p.path} className="text-[0.8125rem]">
                      <a href={`/admin/proofs/${order.id}/${i}`} target="_blank" rel="noopener" className="underline underline-offset-4">
                        {p.fileName}
                      </a>
                      <span className="block text-[0.75rem] text-stone">
                        {time(p.createdAt)}
                        {p.reference ? ` · ${p.reference}` : ""}
                        {p.senderName ? ` · ${p.senderName}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

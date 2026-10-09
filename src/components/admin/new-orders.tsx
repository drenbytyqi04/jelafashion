import Link from "next/link";
import type { Order } from "@/lib/commerce/types";
import { addressLines } from "@/lib/commerce/present";
import { formatDate, formatPrice } from "@/lib/format";
import { formatMeasure } from "@/lib/units";
import { METHOD_LABELS } from "@/components/admin/shared";
import { Btn, StatusBadge } from "@/components/admin/ui";

const when = (iso: string) => {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "tani";
  if (minutes < 60) return `para ${minutes} min`;
  if (minutes < 24 * 60) return `para ${Math.round(minutes / 60)} orësh`;
  return formatDate(iso, "sq");
};

/**
 * One card per order no admin has opened yet, with everything needed to act on it without
 * clicking through: customer and contact, delivery address, payment, every dress with its
 * size or full set of measurements, notes and the total. Opening the order clears it.
 */
export function NewOrders({ orders, total }: { orders: Order[]; total: number }) {
  if (orders.length === 0) return null;
  return (
    <section aria-labelledby="new-orders-title" className="mb-6 rounded-admin border border-champagne bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3">
        <h2 id="new-orders-title" className="flex items-center gap-2 font-semibold">
          <span aria-hidden className="size-2 rounded-full bg-error" />
          Porositë e reja <span className="nums text-stone">({total})</span>
        </h2>
        <p className="text-[0.75rem] text-stone">Përditësohet vetë çdo 30 sekonda</p>
      </div>
      <ul className="divide-y divide-hairline">
        {orders.map((o) => {
          const custom = o.items.some((i) => i.measurements);
          return (
            <li key={o.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_1.4fr]">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/orders/${o.id}`} className="nums text-[1.0625rem] font-semibold underline-offset-4 hover:underline">
                    {o.number}
                  </Link>
                  <StatusBadge status={o.status} />
                  <span className="text-[0.75rem] text-stone">{when(o.createdAt)}</span>
                </div>
                <div className="text-[0.8125rem]">
                  <p className="font-medium">
                    {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                  </p>
                  <p>
                    <a href={`mailto:${o.email}`} className="underline-offset-4 hover:underline">
                      {o.email}
                    </a>
                  </p>
                  <p className="nums">
                    <a href={`tel:${o.phone}`} className="underline-offset-4 hover:underline">
                      {o.phone}
                    </a>
                  </p>
                </div>
                <address className="text-[0.8125rem] not-italic text-stone">
                  {addressLines(o.shippingAddress, "sq")
                    .slice(1)
                    .map((l) => (
                      <span key={l} className="block">
                        {l}
                      </span>
                    ))}
                </address>
                <dl className="nums grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[0.8125rem]">
                  <dt className="text-stone">Pagesa</dt>
                  <dd>
                    {METHOD_LABELS[o.paymentMethod]}
                    {o.proofs.length > 0 && <span className="ml-2 text-gold-ink">ka dëshmi</span>}
                  </dd>
                  <dt className="text-stone">Dërgesa</dt>
                  <dd>
                    {o.shippingMethod.name.sq} · {formatPrice(o.shippingCents, "sq")}
                  </dd>
                  {o.discountCents > 0 && (
                    <>
                      <dt className="text-stone">Zbritja</dt>
                      <dd>
                        {o.discountCode} · -{formatPrice(o.discountCents, "sq")}
                      </dd>
                    </>
                  )}
                  <dt className="font-semibold">Totali</dt>
                  <dd className="font-semibold">{formatPrice(o.totalCents, "sq")}</dd>
                </dl>
              </div>

              <div className="flex flex-col gap-3">
                <ul className="flex flex-col gap-3">
                  {o.items.map((item, i) => (
                    <li key={i} className="rounded-admin bg-linen p-3 text-[0.8125rem]">
                      <div className="flex justify-between gap-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="nums">{formatPrice(item.unitPriceCents * item.quantity, "sq")}</p>
                      </div>
                      <p className="text-stone">
                        {[item.color, item.size === "custom" ? "Me masa" : `Masa ${item.size}`, `Sasia ${item.quantity}`].filter(Boolean).join(" · ")}
                      </p>
                      {item.measurements && (
                        <dl className="nums mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 sm:grid-cols-[1fr_auto_1fr_auto]">
                          {item.measurements.map((m) => (
                            <div key={m.id} className="contents">
                              <dt className="text-stone">{m.label?.sq ?? m.id}</dt>
                              <dd className="text-right">{formatMeasure(m.cm, "sq")} cm</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {item.notes && <p className="mt-2">Shënime: {item.notes}</p>}
                    </li>
                  ))}
                </ul>
                {o.customerNote && (
                  <p className="whitespace-pre-line rounded-admin border border-hairline p-3 text-[0.8125rem]">
                    <span className="font-medium">Shënimi i klientes: </span>
                    {o.customerNote}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Btn asChild size="sm" variant="primary">
                    <Link href={`/admin/orders/${o.id}`}>Hap porosinë</Link>
                  </Btn>
                  {custom && (
                    <Btn asChild size="sm" variant="secondary">
                      <a href={`/admin/print/${o.id}`} target="_blank" rel="noopener">
                        Fleta e masave
                      </a>
                    </Btn>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {total > orders.length && (
        <p className="border-t border-hairline px-4 py-3 text-[0.8125rem]">
          <Link href="/admin/orders" className="underline underline-offset-4">
            Edhe {total - orders.length} porosi të reja në listë
          </Link>
        </p>
      )}
    </section>
  );
}

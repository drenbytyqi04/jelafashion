import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/viewer";
import { orderStore } from "@/lib/commerce/order-store";
import { getCatalog } from "@/lib/catalog/repository";
import { formatDate } from "@/lib/format";
import { formatMeasure } from "@/lib/units";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { PrintButton } from "@/components/admin/print-button";

export const metadata = { title: "Fleta e masave" };

// A4 measurement sheet for the workroom (pages/admin.md): ink only, one page per dress,
// wordmark, image left, measurements in cm right, notes, order number and date.
export default async function MeasurementSheet({ params }: { params: Promise<{ orderId: string }> }) {
  await requireAdmin();
  const { orderId } = await params;
  const order = await orderStore()?.getById(orderId);
  if (!order) notFound();
  const catalog = await getCatalog();
  const items = order.items.filter((i) => i.measurements);

  return (
    <div className="min-h-dvh bg-white py-8 print:py-0">
      <style>{`@page { size: A4; margin: 14mm; } @media print { body { background: white; } }`}</style>
      <div className="mx-auto mb-6 flex max-w-[210mm] justify-end px-4 print:hidden">
        <PrintButton />
      </div>
      {items.length === 0 && <p className="mx-auto max-w-[210mm] px-4">Kjo porosi nuk ka fustane me masa.</p>}
      {items.map((item, idx) => {
        const image = catalog.find((p) => p.slug === item.productSlug)?.images[0];
        return (
          <article key={idx} className="mx-auto flex max-w-[210mm] flex-col px-4 text-ink [break-after:page] last:[break-after:auto] print:px-0">
            <header className="flex items-end justify-between border-b border-ink pb-3">
              <span className="wordmark text-[1.125rem]">Jela Fashion</span>
              <span className="nums text-[0.8125rem]">
                {order.number} · {formatDate(order.createdAt, "sq")} · {idx + 1}/{items.length}
              </span>
            </header>
            <div className="mt-6 grid grid-cols-[38%_1fr] gap-8">
              <div>
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image.url} alt="" className="aspect-[3/4] w-full object-cover" />
                ) : (
                  <ImagePlaceholder ratio="3/4" />
                )}
                <p className="mt-3 font-serif text-[1.5rem] leading-tight">{item.name}</p>
                <p className="text-[0.8125rem]">{[item.color, `Sasia ${item.quantity}`].filter(Boolean).join(" · ")}</p>
                <p className="mt-4 text-[0.8125rem]">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  <br />
                  {order.phone}
                </p>
              </div>
              <div>
                <table className="nums w-full border-collapse text-[0.875rem]">
                  <thead>
                    <tr className="border-b border-ink text-left">
                      <th className="py-2 font-semibold">Masa</th>
                      <th className="py-2 text-right font-semibold">cm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.measurements!.map((m) => (
                      <tr key={m.id} className="border-b border-ink/20">
                        <td className="py-2">{m.label?.sq ?? m.id}</td>
                        <td className="py-2 text-right text-[1rem]">{formatMeasure(m.cm, "sq")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6">
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.12em]">Shënime</p>
                  <p className="mt-2 min-h-24 whitespace-pre-line border border-ink/30 p-3 text-[0.875rem]">
                    {[item.notes, order.customerNote].filter(Boolean).join("\n\n")}
                  </p>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

import Link from "next/link";
import { requireAdmin } from "@/lib/auth/viewer";
import { orderStore } from "@/lib/commerce/order-store";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/commerce/types";
import { cn } from "@/lib/cn";
import { formatDate, formatPrice } from "@/lib/format";
import { Btn, PageHeader, STATUS_LABELS, StatusBadge, Table, TextInput } from "@/components/admin/ui";
import { METHOD_LABELS, Unavailable } from "@/components/admin/shared";

export const metadata = { title: "Porositë" };

const PAGE_SIZE = 50;

type Props = { searchParams: Promise<{ status?: string; q?: string; page?: string }> };

export default async function AdminOrders({ searchParams }: Props) {
  await requireAdmin();
  const store = orderStore();
  if (!store) return <Unavailable />;
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.slice(0, 80) ?? "";
  const { orders, total } = await store.list({ status, query: q, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { status, q: q || undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <>
      <PageHeader
        title="Porositë"
        description={`${total} porosi${status ? ` · ${STATUS_LABELS[status]}` : ""}`}
        actions={
          <Btn asChild>
            <a href={`/admin/orders/export${qs({})}`}>Eksporto CSV</a>
          </Btn>
        }
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filtro sipas statusit" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex gap-1">
            {[undefined, ...ORDER_STATUSES].map((s) => (
              <li key={s ?? "all"}>
                <Link
                  href={`/admin/orders${qs({ status: s, page: undefined })}`}
                  aria-current={status === s ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center whitespace-nowrap rounded-admin border px-3 text-[0.8125rem]",
                    status === s ? "border-ink bg-white" : "border-transparent text-stone hover:text-ink",
                  )}
                >
                  {s ? STATUS_LABELS[s] : "Të gjitha"}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <form className="flex gap-2" role="search">
          {status && <input type="hidden" name="status" value={status} />}
          <TextInput name="q" defaultValue={q} placeholder="Numri ose email-i" aria-label="Kërko porosi" className="w-64" />
          <Btn type="submit">Kërko</Btn>
        </form>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-admin border border-hairline bg-white p-6 text-stone">Asnjë porosi nuk përputhet.</p>
      ) : (
        <Table head={["Porosia", "Data", "Klientja", "Artikuj", "Pagesa", "Totali", "Statusi", ""]}>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/admin/orders/${o.id}`} className="nums font-medium underline-offset-4 hover:underline">
                  {o.number}
                </Link>
              </td>
              <td className="nums whitespace-nowrap text-stone">{formatDate(o.createdAt, "sq")}</td>
              <td className="max-w-56">
                <span className="block truncate">
                  {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                </span>
                <span className="block truncate text-[0.75rem] text-stone">{o.email}</span>
              </td>
              <td className="whitespace-nowrap">
                {o.items.reduce((n, i) => n + i.quantity, 0)}
                {o.items.some((i) => i.size === "custom") && <span className="ml-2 text-[0.75rem] text-gold-ink">me masa</span>}
              </td>
              <td className="whitespace-nowrap">{METHOD_LABELS[o.paymentMethod]}</td>
              <td className="nums whitespace-nowrap">{formatPrice(o.totalCents, "sq")}</td>
              <td>
                <StatusBadge status={o.status} />
              </td>
              <td className="whitespace-nowrap text-[0.75rem] text-gold-ink">{o.status === "awaiting_payment" && o.proofs.length > 0 ? "Ka dëshmi" : ""}</td>
            </tr>
          ))}
        </Table>
      )}

      {pages > 1 && (
        <nav aria-label="Faqet" className="mt-4 flex items-center justify-end gap-2 text-[0.8125rem]">
          {page > 1 && (
            <Btn asChild size="sm">
              <Link href={`/admin/orders${qs({ page: String(page - 1) })}`}>Mbrapa</Link>
            </Btn>
          )}
          <span className="nums text-stone">
            {page} / {pages}
          </span>
          {page < pages && (
            <Btn asChild size="sm">
              <Link href={`/admin/orders${qs({ page: String(page + 1) })}`}>Para</Link>
            </Btn>
          )}
        </nav>
      )}
    </>
  );
}

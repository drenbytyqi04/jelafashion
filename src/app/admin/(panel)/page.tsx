import Link from "next/link";
import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { orderStore } from "@/lib/commerce/order-store";
import { formatDate, formatPrice } from "@/lib/format";
import { PageHeader, Panel, StatusBadge, Table } from "@/components/admin/ui";
import { Unavailable } from "@/components/admin/shared";
import { NewOrders } from "@/components/admin/new-orders";

export const metadata = { title: { absolute: "Paneli · Jela Fashion" } };

export default async function AdminDashboard() {
  await requireAdmin();
  const orders = orderStore();
  const catalog = catalogAdminStore();
  if (!orders || !catalog) return <Unavailable />;
  const [stats, latest, products, unseen] = await Promise.all([orders.stats(), orders.list({ limit: 8 }), catalog.products(), orders.unseen(10)]);
  const lowStock = products.flatMap((p) =>
    p.availability === "in_stock" ? p.sizes.filter((s) => s.stock <= 1).map((s) => ({ product: p, size: s.size, stock: s.stock })) : [],
  );

  const tiles = [
    { label: "Porosi sot", value: String(stats.ordersToday), sub: `${stats.ordersThisWeek} këtë javë` },
    { label: "Të ardhura këtë muaj", value: formatPrice(stats.paidThisMonthCents, "sq"), sub: "Porosi të paguara" },
    { label: "Në pritje të pagesës", value: String(stats.byStatus.awaiting_payment), href: "/admin/orders?status=awaiting_payment" },
    { label: "Me masa në punim", value: String(stats.customInProgress), sub: "Të paguara ose në punim" },
    { label: "Stok i ulët", value: String(lowStock.length), sub: "Masa me 0–1 copë" },
  ];

  return (
    <>
      <PageHeader title="Paneli" description="Pamja e përgjithshme e porosive dhe e stokut." />
      <NewOrders orders={unseen.orders} total={unseen.total} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {tiles.map((t) => {
          const body = (
            <>
              <p className="text-[0.8125rem] text-stone">{t.label}</p>
              <p className="nums mt-2 text-[1.75rem] font-semibold leading-none">{t.value}</p>
              {t.sub && <p className="mt-2 text-[0.75rem] text-stone">{t.sub}</p>}
            </>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="rounded-admin border border-hairline bg-white p-4 hover:border-ink">
              {body}
            </Link>
          ) : (
            <div key={t.label} className="rounded-admin border border-hairline bg-white p-4">
              {body}
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel title="Porositë e fundit" actions={<Link href="/admin/orders" className="text-[0.8125rem] underline underline-offset-4">Të gjitha</Link>} className="[&>div]:p-0">
            {latest.orders.length === 0 ? (
              <p className="p-4 text-stone">Ende nuk ka porosi.</p>
            ) : (
              <Table head={["Porosia", "Data", "Klientja", "Totali", "Statusi"]} className="rounded-none border-0">
                {latest.orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`} className="nums font-medium underline-offset-4 hover:underline">
                        {o.number}
                      </Link>
                    </td>
                    <td className="nums whitespace-nowrap text-stone">{formatDate(o.createdAt, "sq")}</td>
                    <td className="max-w-48 truncate">
                      {o.shippingAddress.firstName} {o.shippingAddress.lastName}
                    </td>
                    <td className="nums whitespace-nowrap">{formatPrice(o.totalCents, "sq")}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Panel>
        </div>
        <Panel title="Stok i ulët">
          {lowStock.length === 0 ? (
            <p className="text-stone">Asnjë masë me stok të ulët.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-hairline">
              {lowStock.slice(0, 12).map((l) => (
                <li key={`${l.product.id}-${l.size}`} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/products/${l.product.id}`} className="truncate hover:underline">
                    {l.product.name.sq} · {l.size}
                  </Link>
                  <span className={l.stock === 0 ? "nums text-error" : "nums text-gold-ink"}>{l.stock}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

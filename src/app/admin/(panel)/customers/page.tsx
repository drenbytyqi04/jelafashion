import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { orderStore } from "@/lib/commerce/order-store";
import { formatDate, formatPrice } from "@/lib/format";
import { Unavailable } from "@/components/admin/shared";
import { PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Klientët" };

type Row = { email: string; name: string; phone: string | null; account: boolean; admin: boolean; orders: number; spentCents: number; last: string };

export default async function AdminCustomers() {
  await requireAdmin();
  const store = catalogAdminStore();
  const orders = orderStore();
  if (!store || !orders) return <Unavailable />;
  const [accounts, { orders: all }] = await Promise.all([store.customers(), orders.list({ limit: 5000 })]);

  // One row per email: accounts plus anyone who ordered as a guest.
  const rows = new Map<string, Row>();
  for (const a of accounts) {
    rows.set(a.email.toLowerCase(), { email: a.email, name: a.fullName ?? "", phone: a.phone, account: true, admin: a.role === "admin", orders: 0, spentCents: 0, last: a.createdAt });
  }
  for (const o of all) {
    const key = o.email.toLowerCase();
    const row = rows.get(key) ?? { email: o.email, name: "", phone: null, account: false, admin: false, orders: 0, spentCents: 0, last: o.createdAt };
    row.orders++;
    if (o.status !== "awaiting_payment" && o.status !== "cancelled") row.spentCents += o.totalCents;
    if (!row.name) row.name = `${o.shippingAddress.firstName} ${o.shippingAddress.lastName}`;
    row.phone ??= o.phone;
    if (o.createdAt > row.last) row.last = o.createdAt;
    rows.set(key, row);
  }
  const list = [...rows.values()].sort((a, b) => b.last.localeCompare(a.last));

  return (
    <>
      <PageHeader title="Klientët" description={`${list.length} klientë · ${accounts.length} me llogari`} />
      <Table head={["Emri", "Email-i", "Telefoni", "Llogari", "Porosi", "Të paguara", "Aktiviteti i fundit"]}>
        {list.map((r) => (
          <tr key={r.email}>
            <td>{r.name || "—"}</td>
            <td>
              <a href={`/admin/orders?q=${encodeURIComponent(r.email)}`} className="underline-offset-4 hover:underline">
                {r.email}
              </a>
            </td>
            <td className="nums whitespace-nowrap">{r.phone ?? "—"}</td>
            <td>{r.admin ? "Admin" : r.account ? "Po" : "Jo"}</td>
            <td className="nums">{r.orders}</td>
            <td className="nums whitespace-nowrap">{formatPrice(r.spentCents, "sq")}</td>
            <td className="nums whitespace-nowrap text-stone">{formatDate(r.last, "sq")}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { formatDate } from "@/lib/format";
import { Unavailable } from "@/components/admin/shared";
import { Btn, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Newsletter-i" };

export default async function AdminNewsletter() {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  const subscribers = await store.subscribers();
  const active = subscribers.filter((s) => !s.unsubscribed);
  return (
    <>
      <PageHeader
        title="Newsletter-i"
        description={`${active.length} të abonuar aktivë`}
        actions={
          <Btn asChild>
            {/* A file download from a route handler, not a page: a plain link is right. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/admin/newsletter/export">Eksporto CSV</a>
          </Btn>
        }
      />
      <Table head={["Email-i", "Gjuha", "Që nga", "Statusi"]}>
        {subscribers.map((s) => (
          <tr key={s.email}>
            <td>{s.email}</td>
            <td>{s.locale === "en" ? "Anglisht" : "Shqip"}</td>
            <td className="nums whitespace-nowrap text-stone">{formatDate(s.createdAt, "sq")}</td>
            <td className={s.unsubscribed ? "text-stone" : "text-success"}>{s.unsubscribed ? "Çabonuar" : "Aktiv"}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

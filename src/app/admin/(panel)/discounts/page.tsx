import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { DiscountsEditor } from "@/components/admin/discounts-editor";
import { Unavailable } from "@/components/admin/shared";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Zbritjet" };

export default async function AdminDiscounts() {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  return (
    <>
      <PageHeader title="Kodet e zbritjes" description="Përdoren te pagesa; çdo përdorim numërohet vetëm kur porosia regjistrohet." />
      <DiscountsEditor discounts={await store.discounts()} />
    </>
  );
}

import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { CollectionsEditor } from "@/components/admin/collections-editor";
import { Unavailable } from "@/components/admin/shared";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Koleksionet" };

export default async function AdminCollections() {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  const [collections, products] = await Promise.all([store.collections(), store.products()]);
  return (
    <>
      <PageHeader title="Koleksionet" description="Grupe fustanesh për faqen kryesore dhe fushatat." />
      <CollectionsEditor collections={collections} products={products.map((p) => ({ id: p.id, name: p.name.sq, published: p.published }))} />
    </>
  );
}

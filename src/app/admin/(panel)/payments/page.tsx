import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { payseraConfigured } from "@/lib/payments/paysera";
import { PaymentsEditor } from "@/components/admin/payments-editor";
import { Unavailable } from "@/components/admin/shared";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Pagesat" };

export default async function AdminPayments() {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  return (
    <>
      <PageHeader title="Mënyrat e pagesës" description="Të dhënat shfaqen te klientja pas porosisë dhe në email-in e konfirmimit, me numrin e porosisë si referencë." />
      <PaymentsEditor methods={await store.paymentMethods()} payseraConfigured={payseraConfigured()} />
    </>
  );
}

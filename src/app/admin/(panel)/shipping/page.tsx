import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { countryOptions } from "@/lib/commerce/countries";
import { ShippingEditor } from "@/components/admin/shipping-editor";
import { Unavailable } from "@/components/admin/shared";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Dërgesat" };

export default async function AdminShipping() {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  const countryNames = Object.fromEntries(countryOptions("sq").map((c) => [c.code, c.name]));
  return (
    <>
      <PageHeader title="Zonat e dërgesës" description="Klientja sheh tarifat e zonës ku bën pjesë shteti i saj; përndryshe tarifat e pjesës tjetër të botës." />
      <ShippingEditor zones={await store.zones()} countryNames={countryNames} />
    </>
  );
}

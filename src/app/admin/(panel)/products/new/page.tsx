import Link from "next/link";
import { requireAdmin } from "@/lib/auth/viewer";
import { getMeasurementDefinitions } from "@/lib/catalog/repository";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Produkt i ri" };

export default async function NewProduct() {
  await requireAdmin();
  const definitions = await getMeasurementDefinitions();
  return (
    <>
      <p className="mb-2 text-[0.8125rem]">
        <Link href="/admin/products" className="text-stone hover:text-ink">
          ← Produktet
        </Link>
      </p>
      <PageHeader title="Produkt i ri" description="Ruaje si draft dhe publikoje kur fotot dhe përshkrimi të jenë gati." />
      <ProductForm product={null} definitions={definitions} />
    </>
  );
}

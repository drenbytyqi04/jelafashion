import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { getMeasurementDefinitions } from "@/lib/catalog/repository";
import { localMediaUrl } from "@/lib/local-db";
import { ProductForm } from "@/components/admin/product-form";
import { Unavailable } from "@/components/admin/shared";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Produkti" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  const { id } = await params;
  const [product, definitions] = await Promise.all([store.product(id), getMeasurementDefinitions()]);
  if (!product) notFound();
  const withUrls = { ...product, images: product.images.map((i) => ({ ...i, url: i.url ?? localMediaUrl("product-images", i.path) })) };
  return (
    <>
      <p className="mb-2 text-[0.8125rem]">
        <Link href="/admin/products" className="text-stone hover:text-ink">
          ← Produktet
        </Link>
      </p>
      <PageHeader title={product.name.sq} description={product.published ? "Publikuar" : "Draft, nuk shfaqet në faqe"} />
      <ProductForm key={product.updatedAt} product={withUrls} definitions={definitions} />
    </>
  );
}

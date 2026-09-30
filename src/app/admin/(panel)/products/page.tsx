import Link from "next/link";
import { requireAdmin } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { formatPrice } from "@/lib/format";
import { localMediaUrl } from "@/lib/local-db";
import { Unavailable } from "@/components/admin/shared";
import { Btn, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Produktet" };

const CATEGORY = { bridal: "Nusëri", evening: "Mbrëmje", short: "Të shkurtra" } as const;

export default async function AdminProducts() {
  await requireAdmin();
  const store = catalogAdminStore();
  if (!store) return <Unavailable />;
  const products = await store.products();

  return (
    <>
      <PageHeader
        title="Produktet"
        description={`${products.length} produkte · ${products.filter((p) => p.published).length} të publikuara`}
        actions={
          <Btn variant="primary" asChild>
            <Link href="/admin/products/new">Shto produkt</Link>
          </Btn>
        }
      />
      <Table head={["", "Emri", "Kategoria", "Çmimi", "Disponueshmëria", "Stoku", "Statusi"]}>
        {products.map((p) => {
          const img = p.images[0];
          const src = img ? (img.url ?? localMediaUrl("product-images", img.path)) : null;
          return (
            <tr key={p.id}>
              <td className="w-12">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt="" className="h-10 w-[30px] rounded-[2px] object-cover" />
                ) : (
                  <span aria-hidden className="block h-10 w-[30px] rounded-[2px]" style={{ background: p.colors[0]?.hex ?? "var(--color-linen)" }} />
                )}
              </td>
              <td>
                <Link href={`/admin/products/${p.id}`} className="font-medium underline-offset-4 hover:underline">
                  {p.name.sq}
                </Link>
                <span className="block text-[0.75rem] text-stone">/{p.slug}</span>
              </td>
              <td>{CATEGORY[p.category]}</td>
              <td className="nums whitespace-nowrap">{formatPrice(p.priceCents, "sq")}</td>
              <td className="whitespace-nowrap">{p.availability === "in_stock" ? "Në stok" : `Me porosi · ${p.productionWeeks} javë`}</td>
              <td className="nums">{p.availability === "in_stock" ? p.sizes.reduce((n, s) => n + s.stock, 0) : "—"}</td>
              <td>
                <span className={p.published ? "text-success" : "text-stone"}>{p.published ? "Publikuar" : "Draft"}</span>
                {p.featured && <span className="ml-2 text-[0.75rem] text-gold-ink">I veçuar</span>}
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getCatalog, getCategories, getProduct, getProductMeasurements } from "@/lib/catalog/repository";
import type { CatalogProduct, Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { site, whatsappHref } from "@/lib/site";
import { Accordion } from "@/components/ui/accordion";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductRail } from "@/components/product/product-rail";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { RecentlyViewed } from "@/components/product/recently-viewed";

type Props = { params: Promise<{ locale: string; slug: string }> };

// Prerendered per dress, refreshed at most every 5 minutes.
export const revalidate = 300;

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return routing.locales.flatMap((locale) => catalog.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug);
  if (!product) return {};
  const l = locale as Locale;
  return {
    title: pick(product.name, l),
    description: pick(product.description, l),
  };
}

/** Card fields only for client rails: long copy stays on the server. */
const forCard = (p: CatalogProduct): CatalogProduct => ({
  ...p,
  description: { sq: "", en: "" },
  fabricCare: { sq: "", en: "" },
});

export default async function ProductPage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const product = await getProduct(slug);
  if (!product) notFound();

  const t = await getTranslations("product");
  const [catalog, categories, measurements] = await Promise.all([
    getCatalog(),
    getCategories(),
    getProductMeasurements(product),
  ]);
  const category = categories.find((c) => c.id === product.category);
  const name = pick(product.name, locale);
  const url = `${site.url}${getPathname({ href: { pathname: "/dress/[slug]", params: { slug } }, locale })}`;
  const wa = whatsappHref(t("whatsappMessage", { name, url }));
  const related = catalog.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const categoryHref = product.category === "bridal" ? "/bridal" : product.category === "evening" ? "/evening" : "/short";

  return (
    <>
      {/* Full-bleed gallery on phones; inside the page container from tablet up. */}
      <div className="mx-auto w-full max-w-[90rem] pt-(--header-h) md:px-(--gutter) md:pt-[calc(var(--header-h)+32px)]">
        <nav aria-label={t("breadcrumb")} className="container-page py-4 md:px-0 md:pt-0">
          <ol className="flex flex-wrap items-center gap-2 text-small text-stone">
            <li>
              <Link href="/" className="hover:text-ink">
                {t("home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={categoryHref} className="hover:text-ink">
                {category ? pick(category.name, locale) : product.category}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-ink">
              {name}
            </li>
          </ol>
        </nav>

        <div className="md:grid md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7">
            <ProductGallery product={product} locale={locale} />
          </div>
          <div className="container-page mt-8 md:col-span-5 md:mt-0 md:px-0 lg:col-span-4 lg:col-start-9">
            <div className="md:sticky md:top-[calc(var(--header-offset)+32px)] md:transition-[top] md:duration-(--duration-ui)">
              <PurchasePanel product={product} measurements={measurements} whatsappHref={wa} />
              <Accordion
                className="mt-10"
                type="multiple"
                defaultValue="description"
                headingLevel={2}
                items={[
                  { value: "description", title: t("accordion.description"), content: <p>{pick(product.description, locale)}</p> },
                  { value: "fabric", title: t("accordion.fabricCare"), content: <p>{pick(product.fabricCare, locale)}</p> },
                  { value: "delivery", title: t("accordion.delivery"), content: <p>{t("deliveryText")}</p> },
                  { value: "mtm", title: t("accordion.mtm"), content: <p>{t("mtmText", { count: measurements.length })}</p> },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <ProductRail id="related" title={t("related")} products={related.map(forCard)} />
      <RecentlyViewed current={product.slug} catalog={catalog.map(forCard)} />
      <div className="pb-24 lg:pb-32" />
    </>
  );
}

import { getTranslations } from "next-intl/server";
import { parseFilters } from "@/lib/catalog/filters";
import { getCatalog, getCategories } from "@/lib/catalog/repository";
import type { CatalogProduct, CategoryId, Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { RevealText } from "@/components/motion/reveal-text";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { CollectionView } from "./collection-view";

export type CollectionScope = { kind: "category"; category: CategoryId } | { kind: "all" } | { kind: "new-in" };

const BANNER_TINT: Record<string, string> = {
  bridal: "#F4EDE1",
  evening: "#5C534C",
  short: "#EBD3CB",
  all: "#E6DCCD",
  "new-in": "#D9C3A0",
};

/** Card fields only: descriptions and care text stay on the server. */
function forCard(p: CatalogProduct): CatalogProduct {
  return { ...p, description: { sq: "", en: "" }, fabricCare: { sq: "", en: "" } };
}

export async function CollectionPage({
  scope,
  locale,
  searchParams,
}: {
  scope: CollectionScope;
  locale: Locale;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const t = await getTranslations("collection");
  const [catalog, categories] = await Promise.all([getCatalog(), getCategories()]);

  const inScope = scope.kind === "category" ? catalog.filter((p) => p.category === scope.category) : catalog;
  const filters = parseFilters(searchParams);
  if (scope.kind === "category") filters.category = [];

  let title: string;
  let intro: string;
  if (scope.kind === "category") {
    const c = categories.find((x) => x.id === scope.category);
    title = c ? pick(c.name, locale) : scope.category;
    intro = c ? pick(c.intro, locale) : "";
  } else if (scope.kind === "new-in") {
    title = t("newInTitle");
    intro = t("newInIntro");
  } else {
    title = t("shopTitle");
    intro = t("shopIntro");
  }
  const tintKey = scope.kind === "category" ? scope.category : scope.kind;

  return (
    <>
      <header className="container-page pb-10 pt-[calc(var(--header-h)+24px)] lg:grid lg:grid-cols-12 lg:items-end lg:gap-6 lg:pb-20 lg:pt-[calc(var(--header-h)+48px)]">
        <div className="lg:order-2 lg:col-span-5 lg:col-start-8">
          <ImagePlaceholder ratio="4/5" tint={BANNER_TINT[tintKey]} className="lg:aspect-[3/4]" />
        </div>
        <div className="mt-8 lg:order-1 lg:col-span-6 lg:mt-0 lg:pb-8">
          <span aria-hidden className="mb-8 block h-px w-16 bg-champagne" />
          <RevealText as="h1" immediate lines={[title]} className="font-serif text-h1 font-light" />
          {intro && <p className="measure mt-5 font-serif text-lead text-stone">{intro}</p>}
        </div>
      </header>
      <CollectionView
        products={inScope.map(forCard)}
        initialFilters={filters}
        showCategory={scope.kind !== "category"}
      />
    </>
  );
}

export function CollectionSkeleton() {
  return (
    <div aria-hidden className="container-page pb-24 pt-[calc(var(--header-h)+24px)]">
      <div className="lg:grid lg:grid-cols-12 lg:gap-6">
        <div className="lg:order-2 lg:col-span-5 lg:col-start-8">
          <span className="block aspect-[4/5] animate-skeleton bg-linen lg:aspect-[3/4]" />
        </div>
        <div className="mt-8 lg:order-1 lg:col-span-6 lg:self-end">
          <span className="block h-12 w-2/3 animate-skeleton bg-linen" />
          <span className="mt-5 block h-5 w-full max-w-md animate-skeleton bg-linen" />
        </div>
      </div>
      <div className="mt-16 grid grid-cols-2 gap-x-3 gap-y-10 lg:ml-[25%] lg:grid-cols-3 lg:gap-x-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>
            <span className="block aspect-[3/4] animate-skeleton bg-linen" />
            <span className="mt-4 block h-4 w-3/4 animate-skeleton bg-linen" />
            <span className="mt-2 block h-4 w-1/3 animate-skeleton bg-linen" />
          </div>
        ))}
      </div>
    </div>
  );
}

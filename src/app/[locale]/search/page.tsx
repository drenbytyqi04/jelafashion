import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalog } from "@/lib/catalog/repository";
import { searchText, type SearchLabels } from "@/lib/catalog/search";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { SearchView } from "@/components/discovery/search-view";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.search" });
  return pageMetadata({ locale, href: "/search", title: t("metaTitle"), noindex: true });
}

async function labels(locale: Locale): Promise<SearchLabels> {
  const { collection } = (await import(`../../../../messages/${locale}.json`)).default;
  return { category: collection.category, color: collection.color, length: collection.length, sleeves: collection.sleeves };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const [catalog, sq, en] = await Promise.all([getCatalog(), labels("sq"), labels("en")]);
  const index = catalog.map((product) => ({ product, text: searchText(product, { sq, en }) }));
  return <SearchView index={index} initialQuery={((await searchParams).q ?? "").slice(0, 80)} />;
}

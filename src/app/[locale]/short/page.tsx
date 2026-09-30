import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionPage } from "@/components/collection/collection-page";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "seo.short" });
  return pageMetadata({ locale, href: "/short", title: t("title"), description: t("description") });
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <CollectionPage scope={{ kind: "category", category: "short" }} locale={locale as Locale} searchParams={await searchParams} />;
}

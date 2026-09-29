import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CollectionPage } from "@/components/collection/collection-page";
import type { Locale } from "@/lib/catalog/types";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "collection" });
  return { title: t("shopTitle") };
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <CollectionPage scope={{ kind: "all" }} locale={locale as Locale} searchParams={await searchParams} />;
}

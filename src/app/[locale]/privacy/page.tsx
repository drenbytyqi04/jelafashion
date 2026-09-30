import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/catalog/types";
import { TextPage, textPageMetadata } from "@/components/content/text-page";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return textPageMetadata((await params).locale as Locale, "privacy");
}

export default async function Page({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  return <TextPage locale={locale} pageKey="privacy" />;
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { CartPageView } from "@/components/cart/cart-page-view";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "cart" });
  return pageMetadata({ locale: locale as Locale, href: "/cart", title: t("pageTitle"), noindex: true });
}

export default async function CartPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  return <CartPageView />;
}

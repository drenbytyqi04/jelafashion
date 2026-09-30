import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCatalog } from "@/lib/catalog/repository";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { WishlistView } from "@/components/discovery/wishlist-view";

type Props = { params: Promise<{ locale: string }> };

export const revalidate = 300;

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.wishlist" });
  return pageMetadata({ locale, href: "/wishlist", title: t("metaTitle"), noindex: true });
}

export default async function WishlistPage({ params }: Props) {
  setRequestLocale((await params).locale as Locale);
  return <WishlistView products={await getCatalog()} />;
}

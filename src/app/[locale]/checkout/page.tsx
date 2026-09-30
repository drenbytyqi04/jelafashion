import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/catalog/types";
import { getPaymentMethods, getShippingZones } from "@/lib/commerce/config";
import { countryOptions } from "@/lib/commerce/countries";
import { CheckoutView } from "@/components/checkout/checkout-view";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "checkout" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const [zones, methods, h] = await Promise.all([getShippingZones(), getPaymentMethods(), headers()]);
  const countries = countryOptions(locale as Locale);
  // Vercel's geo header preselects the visitor's country; Kosovo otherwise.
  const ip = h.get("x-vercel-ip-country")?.toUpperCase();
  const defaultCountry = ip && countries.some((c) => c.code === ip) ? ip : "XK";
  return <CheckoutView zones={zones} methods={methods} countries={countries} defaultCountry={defaultCountry} />;
}

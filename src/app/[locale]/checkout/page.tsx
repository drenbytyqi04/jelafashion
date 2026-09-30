import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/catalog/types";
import { getPaymentMethods, getShippingZones } from "@/lib/commerce/config";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import { getPathname } from "@/i18n/navigation";
import { accountStore } from "@/lib/account/store";
import { getViewer } from "@/lib/auth/viewer";
import { countryOptions } from "@/lib/commerce/countries";
import { CheckoutView, type CheckoutAccount } from "@/components/checkout/checkout-view";

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

  const viewer = await getViewer();
  let account: CheckoutAccount | null = null;
  if (viewer) {
    const addresses = (await (await accountStore())?.addresses(viewer.id).catch(() => [])) ?? [];
    const phone = viewer.phone ? parsePhoneNumberFromString(viewer.phone) : undefined;
    account = {
      email: viewer.email,
      phoneCountry: phone?.country ?? null,
      phone: phone ? phone.formatNational() : viewer.phone,
      addresses,
    };
  }
  const checkoutPath = getPathname({ locale: locale as Locale, href: "/checkout" });
  const signInHref = `${getPathname({ locale: locale as Locale, href: "/account" })}?next=${encodeURIComponent(checkoutPath)}`;

  return (
    <CheckoutView
      zones={zones}
      methods={methods}
      countries={countries}
      defaultCountry={defaultCountry}
      account={account}
      signInHref={signInHref}
    />
  );
}

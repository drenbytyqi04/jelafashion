import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { accountStore } from "@/lib/account/store";
import { getViewer } from "@/lib/auth/viewer";
import type { Locale } from "@/lib/catalog/types";
import { countryOptions } from "@/lib/commerce/countries";
import { AccountShell } from "@/components/account/account-shell";
import { AddressesView } from "@/components/account/addresses-view";
import { SignInSection } from "@/components/account/sign-in-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "account" });
  return { title: `${t("nav.addresses")} · ${t("metaTitle")}`, robots: { index: false } };
}

export default async function AccountAddressesPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const viewer = await getViewer();
  if (!viewer) return <SignInSection locale={locale} path="/account/addresses" />;
  const addresses = (await (await accountStore())?.addresses(viewer.id)) ?? [];
  const countries = countryOptions(locale).map(({ code, name }) => ({ code, name }));
  return (
    <AccountShell viewer={viewer} locale={locale} active="addresses">
      <AddressesView addresses={addresses} countries={countries} defaultCountry="XK" />
    </AccountShell>
  );
}

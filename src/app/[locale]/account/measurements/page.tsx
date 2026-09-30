import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { accountStore } from "@/lib/account/store";
import { getViewer } from "@/lib/auth/viewer";
import { getMeasurementDefinitions } from "@/lib/catalog/repository";
import type { Locale } from "@/lib/catalog/types";
import { AccountShell } from "@/components/account/account-shell";
import { MeasurementsView } from "@/components/account/measurements-view";
import { SignInSection } from "@/components/account/sign-in-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "account" });
  return { title: `${t("nav.measurements")} · ${t("metaTitle")}`, robots: { index: false } };
}

export default async function AccountMeasurementsPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const viewer = await getViewer();
  if (!viewer) return <SignInSection locale={locale} path="/account/measurements" />;
  const [profiles, definitions] = await Promise.all([
    (async () => (await (await accountStore())?.measurementProfiles(viewer.id)) ?? [])(),
    getMeasurementDefinitions(),
  ]);
  return (
    <AccountShell viewer={viewer} locale={locale} active="measurements">
      <MeasurementsView profiles={profiles} definitions={definitions} />
    </AccountShell>
  );
}

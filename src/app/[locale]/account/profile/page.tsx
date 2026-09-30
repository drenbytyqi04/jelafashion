import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getViewer } from "@/lib/auth/viewer";
import type { Locale } from "@/lib/catalog/types";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileForm } from "@/components/account/profile-form";
import { SignInSection } from "@/components/account/sign-in-section";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "account" });
  return { title: `${t("nav.profile")} · ${t("metaTitle")}`, robots: { index: false } };
}

export default async function AccountProfilePage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const viewer = await getViewer();
  if (!viewer) return <SignInSection locale={locale} path="/account/profile" />;
  return (
    <AccountShell viewer={viewer} locale={locale} active="profile">
      <ProfileForm viewer={viewer} />
    </AccountShell>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getViewer, safeNext } from "@/lib/auth/viewer";
import type { Locale } from "@/lib/catalog/types";
import { orderStore } from "@/lib/commerce/order-store";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AccountShell } from "@/components/account/account-shell";
import { SignInSection } from "@/components/account/sign-in-section";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ error?: string; next?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "account" });
  return { title: t("metaTitle"), robots: { index: false } };
}

export default async function AccountOrdersPage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const viewer = await getViewer();
  const query = await searchParams;
  if (!viewer) return <SignInSection locale={locale} path="/account" next={query.next} linkError={query.error === "link"} />;
  // Signed in with a destination (e.g. back to checkout): go there.
  if (query.next) redirect(safeNext(query.next, `/${locale}`));

  const t = await getTranslations("account.orders");
  const to = await getTranslations("order.status");
  const tc = await getTranslations("cart");
  const orders = (await orderStore()?.listForCustomer(viewer.id, viewer.email)) ?? [];

  return (
    <AccountShell viewer={viewer} locale={locale} active="orders">
      {orders.length === 0 ? (
        <div className="max-w-xl">
          <p className="font-serif text-h3">{t("empty")}</p>
          <p className="mt-3 text-body text-stone">{t("emptyText")}</p>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/shop">{tc("emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline border-y border-hairline">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={{ pathname: "/order/[token]", params: { token: o.accessToken } }}
                aria-label={t("view", { number: o.number })}
                className="group grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 py-6 md:grid-cols-[10rem_1fr_auto_auto] md:items-center"
              >
                <span className="nums font-serif text-[1.25rem]">{o.number}</span>
                <span className="nums text-right font-serif text-price md:order-last">{formatPrice(o.totalCents, locale)}</span>
                <span className="text-small text-stone">
                  {t("placedOn", { date: formatDate(o.createdAt, locale) })} · {o.items.map((i) => i.name).join(", ")}
                </span>
                <span className="md:justify-self-end">
                  <Badge tone={o.status === "awaiting_payment" ? "gold" : o.status === "cancelled" ? "neutral" : "success"}>{to(o.status)}</Badge>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AccountShell>
  );
}

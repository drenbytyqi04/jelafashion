import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { getPaymentMethods } from "@/lib/commerce/config";
import { orderStore } from "@/lib/commerce/order-store";
import { addressLines, paymentDetailRows } from "@/lib/commerce/present";
import { OFFLINE_METHODS } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { whatsappHref } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MeasurementsList } from "@/components/checkout/measurements-list";
import { CardPaymentStatus } from "@/components/order/card-payment-status";
import { PaymentDetails } from "@/components/order/payment-details";
import { ProofUpload } from "@/components/order/proof-upload";
import { PurchaseTracker } from "@/components/tracking/purchase-tracker";
import { purchaseEventId } from "@/lib/tracking/meta-capi";
import { purchaseIsFinal } from "@/lib/tracking/purchase";

type Props = {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ payment?: string }>;
};

// The token in the URL is the key to the order: never indexed, never sent as a referrer.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, token } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "order" });
  const order = await orderStore()?.getByToken(token);
  return {
    title: order ? t("metaTitle", { number: order.number }) : t("notFoundTitle"),
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function OrderPage({ params, searchParams }: Props) {
  const { locale: rawLocale, token } = await params;
  const { payment } = await searchParams;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("order");
  const tc = await getTranslations("checkout");
  const tcart = await getTranslations("cart");

  const order = await orderStore()?.getByToken(token);
  const top = "container-page pb-24 pt-[calc(var(--header-h)+40px)] lg:pb-32 lg:pt-[calc(var(--header-h)+72px)]";

  if (!order) {
    return (
      <section className={top}>
        <div className="max-w-xl">
          <h1 className="font-serif text-h2 font-light">{t("notFoundTitle")}</h1>
          <p className="mt-4 text-body text-stone">{t("notFoundText")}</p>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/shop">{t("continue")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  const awaiting = order.status === "awaiting_payment";
  const offline = OFFLINE_METHODS.includes(order.paymentMethod);
  const method = (await getPaymentMethods()).find((m) => m.id === order.paymentMethod);
  const amount = formatPrice(order.totalCents, locale);
  const wa = whatsappHref(t("questions", { number: order.number }));
  const price = (c: number) => formatPrice(c, locale);

  return (
    <section className={top}>
      <PurchaseTracker
        token={order.accessToken}
        orderNumber={order.number}
        eventId={purchaseEventId(order)}
        final={purchaseIsFinal(order)}
        value={order.totalCents / 100}
        shipping={order.shippingCents / 100}
        items={order.items.map((i) => ({ id: i.productSlug, name: i.name, price: i.unitPriceCents / 100, quantity: i.quantity, variant: i.size }))}
      />
      <div className="grid gap-16 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <p className="label text-stone">{order.number}</p>
          <h1 className="mt-4 font-serif text-h1 font-light">{t("thanks", { name: order.shippingAddress.firstName })}</h1>
          <p className="mt-4 text-body">{t("received", { number: order.number })}</p>
          <p className="mt-1 text-body text-stone">{t("emailSent", { email: order.email })}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-small text-stone">{t("statusLabel")}</span>
            <Badge tone={awaiting ? "gold" : order.status === "cancelled" ? "neutral" : "success"}>{t(`status.${order.status}`)}</Badge>
          </div>

          <div className="mt-12">
            {awaiting && order.paymentMethod === "paysera" && (
              <CardPaymentStatus token={order.accessToken} cancelled={payment === "cancelled"} />
            )}

            {awaiting && offline && (
              <>
                <div className="border border-hairline bg-linen p-6 md:p-8">
                  <h2 className="font-serif text-[1.5rem]">{t("payTitle")}</h2>
                  <p className="mt-3 text-body">
                    {order.paymentMethod === "cash_agency" ? t("cashIntro", { amount }) : t("payIntro", { amount, number: order.number })}
                  </p>
                  <div className="mt-6">
                    <PaymentDetails rows={paymentDetailRows(order, method, locale)} />
                  </div>
                  <p className="mt-6 text-small text-stone">{t("productionStarts")}</p>
                </div>

                <div id="proof" className="mt-12 scroll-mt-[calc(var(--header-h)+24px)] border-t border-hairline pt-10">
                  <h2 className="font-serif text-[1.5rem]">{t("proofTitle")}</h2>
                  <p className="mb-8 mt-2 text-body text-stone">{t("proofText")}</p>
                  {order.proofs.length > 0 && (
                    <div className="mb-8">
                      <h3 className="label text-stone">{t("proofList")}</h3>
                      <ul className="mt-3 flex flex-col gap-1 text-small">
                        {order.proofs.map((p) => (
                          <li key={p.createdAt} className="flex flex-wrap gap-x-2">
                            <span className="break-all">{p.fileName}</span>
                            {p.reference && <span className="text-stone">· {p.reference}</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <ProofUpload token={order.accessToken} cash={order.paymentMethod === "cash_agency"} />
                </div>
              </>
            )}

            {!awaiting && order.status !== "cancelled" && (
              <div className="border-l border-champagne pl-6">
                <h2 className="font-serif text-[1.5rem]">{t("paidTitle")}</h2>
                <p className="mt-2 text-body text-stone">{t("paidText")}</p>
                {order.trackingNumber && (
                  <p className="nums mt-4 text-small">
                    {t("tracking")}: {order.trackingCarrier ? `${order.trackingCarrier} · ` : ""}
                    {order.trackingNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          <p className="mt-12 text-small text-stone">
            {wa ? (
              <a href={wa} target="_blank" rel="noopener" className="link-underline">
                {t("questions", { number: order.number })}
              </a>
            ) : (
              t("questions", { number: order.number })
            )}
          </p>
          <p className="mt-2 text-small text-stone">{t("saveLink")}</p>
        </div>

        <aside aria-labelledby="order-details" className="lg:col-span-4 lg:col-start-9">
          <div className="bg-linen p-6 lg:p-8">
            <h2 id="order-details" className="font-serif text-[1.5rem]">
              {t("details")}
            </h2>
            <ul className="mt-6 flex flex-col divide-y divide-hairline">
              {order.items.map((item, i) => (
                <li key={i} className="py-4 first:pt-0">
                  <div className="flex justify-between gap-4">
                    <p className="font-serif text-[1.125rem] leading-tight">{item.name}</p>
                    <p className="nums text-small">{price(item.unitPriceCents * item.quantity)}</p>
                  </div>
                  <p className="mt-1 text-small text-stone">
                    {item.color && <>{item.color} · </>}
                    {item.size === "custom" ? tcart("customSize") : tcart("size", { size: item.size })}
                    {item.quantity > 1 && <> · {tcart("quantity", { count: item.quantity })}</>}
                  </p>
                  {item.measurements && (
                    <details className="mt-2">
                      <summary className="flex min-h-11 cursor-pointer items-center text-small">
                        <span className="link-underline">{tcart("viewMeasurements")}</span>
                      </summary>
                      <div className="pb-2 pt-1">
                        <MeasurementsList measurements={item.measurements} unit={item.measurementUnit ?? "cm"} notes={item.notes} />
                      </div>
                    </details>
                  )}
                </li>
              ))}
            </ul>
            <dl className="nums mt-2 flex flex-col gap-2 border-t border-hairline pt-4 text-small">
              <div className="flex justify-between gap-4">
                <dt>{tc("subtotal")}</dt>
                <dd>{price(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between gap-4">
                  <dt>{tc("discountLine", { code: order.discountCode ?? "" })}</dt>
                  <dd>-{price(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt>{tc("shippingLine")}</dt>
                <dd>{order.shippingCents ? price(order.shippingCents) : tc("shippingFree")}</dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-hairline pt-4">
                <dt className="text-body">{tc("total")}</dt>
                <dd className="font-serif text-price">{price(order.totalCents)}</dd>
              </div>
            </dl>

            <dl className="mt-8 flex flex-col gap-6 border-t border-hairline pt-6 text-small">
              <div>
                <dt className="label text-stone">{t("deliveryTo")}</dt>
                <dd className="mt-2">
                  {addressLines(order.shippingAddress, locale).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="label text-stone">{t("shippingMethod")}</dt>
                <dd className="mt-2">
                  {order.shippingMethod.name[locale]} · {tc("shippingDays", { min: order.shippingMethod.minDays, max: order.shippingMethod.maxDays })}
                </dd>
              </div>
              <div>
                <dt className="label text-stone">{t("paymentMethod")}</dt>
                <dd className="mt-2">{tc(`methods.${order.paymentMethod}.label`)}</dd>
              </div>
            </dl>
          </div>
          <Button asChild variant="text" className="mt-6">
            <Link href="/shop">{t("continue")}</Link>
          </Button>
        </aside>
      </div>
    </section>
  );
}

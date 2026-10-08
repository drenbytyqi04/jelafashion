import "server-only";
import { createTranslator } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { getPaymentMethods } from "@/lib/commerce/config";
import { addressLines, paymentDetailRows } from "@/lib/commerce/present";
import type { Order, OrderStatus } from "@/lib/commerce/types";
import { OFFLINE_METHODS } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import { formatMeasure, toUnit } from "@/lib/units";
import { OrderEmail, type OrderEmailProps } from "@/emails/order-email";
import { SimpleEmail } from "@/emails/simple-email";
import { sendEmail, shopInbox } from "./send";

// Every email is written in the customer's language (the locale she ordered in). Shop
// alerts go to the atelier in Albanian.

async function translator(locale: Locale) {
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return createTranslator({ locale, messages });
}

export const orderUrl = (origin: string, order: Pick<Order, "locale" | "accessToken">) =>
  origin + getPathname({ locale: order.locale, href: { pathname: "/order/[token]", params: { token: order.accessToken } } });

async function orderBlocks(order: Order, origin: string) {
  const t = await translator(order.locale);
  const locale = order.locale;
  const price = (c: number) => formatPrice(c, locale);
  const items: NonNullable<OrderEmailProps["items"]> = {
    title: t("emails.items"),
    lines: order.items.map((i) => {
      const unit = i.measurementUnit ?? "cm";
      const unitLabel = unit === "cm" ? "cm" : locale === "sq" ? "inç" : "in";
      return {
        name: i.name,
        meta: [i.color, i.size === "custom" ? t("emails.customSize") : t("emails.size", { size: i.size }), t("emails.quantity", { count: i.quantity })]
          .filter(Boolean)
          .join(" · "),
        price: price(i.unitPriceCents * i.quantity),
        measurementsTitle: i.measurements ? t("emails.measurements", { unit: unitLabel }) : undefined,
        measurements: i.measurements?.map((m) => ({
          label: m.label ? m.label[locale] : m.id,
          value: formatMeasure(toUnit(m.cm, unit), locale),
        })),
        notes: i.notes ? t("emails.notes", { notes: i.notes }) : undefined,
      };
    }),
    totals: [
      { label: t("checkout.subtotal"), value: price(order.subtotalCents) },
      ...(order.discountCents ? [{ label: t("checkout.discountLine", { code: order.discountCode ?? "" }), value: `-${price(order.discountCents)}` }] : []),
      { label: t("emails.shipping", { name: order.shippingMethod.name[locale] }), value: order.shippingCents ? price(order.shippingCents) : t("checkout.shippingFree") },
    ],
    total: { label: t("checkout.total"), value: price(order.totalCents) },
  };
  const common = {
    lang: locale,
    orderLabel: t("emails.orderNumber", { number: order.number }),
    footer: t("emails.footer"),
    help: t("emails.help"),
    siteUrl: `${origin}/${locale}`,
    address: { title: t("emails.deliveryTo"), lines: addressLines(order.shippingAddress, locale) },
  };
  return { t, items, common, url: orderUrl(origin, order) };
}

const firstName = (o: Order) => o.shippingAddress.firstName;

/** After checkout: offline methods get payment instructions; card orders get it once paid. */
export async function sendOrderConfirmation(order: Order, origin: string) {
  const { t, items, common, url } = await orderBlocks(order, origin);
  const offline = OFFLINE_METHODS.includes(order.paymentMethod) && order.status === "awaiting_payment";
  let instructions: OrderEmailProps["instructions"];
  if (offline) {
    const method = (await getPaymentMethods()).find((m) => m.id === order.paymentMethod);
    const amount = formatPrice(order.totalCents, order.locale);
    instructions = {
      title: t("emails.instructions.title"),
      intro:
        order.paymentMethod === "cash_agency"
          ? t("emails.instructions.cashIntro", { amount })
          : t("emails.instructions.intro", { amount, number: order.number }),
      details: paymentDetailRows(order, method, order.locale).map((r) => ({ label: t(`payment.${r.key}`), value: r.value })),
      after: t("emails.instructions.after"),
      upload: { label: t("emails.instructions.upload"), href: `${url}#proof` },
    };
  }
  return sendEmail({
    to: order.email,
    subject: t("emails.confirmation.subject", { number: order.number }),
    tag: "order-confirmation",
    replyTo: shopInbox() ?? undefined,
    react: OrderEmail({
      ...common,
      preview: t("emails.confirmation.preview"),
      heading: t("emails.confirmation.heading", { name: firstName(order) }),
      intro: [order.status === "paid" ? t("emails.confirmation.paidIntro") : t("emails.confirmation.intro")],
      cta: offline ? undefined : { label: t("emails.viewOrder"), href: url },
      instructions,
      items,
    }),
  });
}

/** Offline payment confirmed by the atelier (Phase 5 admin) or a later status change. */
export async function sendStatusUpdate(order: Order, origin: string, status: OrderStatus = order.status) {
  const { t, common, url } = await orderBlocks(order, origin);
  const paid = status === "paid";
  const intro = paid ? [t("emails.paymentReceived.text")] : [t(`emails.status.${status as "in_production" | "shipped" | "delivered" | "cancelled"}`)];
  if (status === "shipped" && order.trackingNumber) {
    intro.push(t("emails.tracking", { number: order.trackingNumber }));
    if (order.trackingCarrier) intro.push(t("emails.carrier", { carrier: order.trackingCarrier }));
  }
  return sendEmail({
    to: order.email,
    subject: paid ? t("emails.paymentReceived.subject", { number: order.number }) : t("emails.status.subject", { number: order.number }),
    tag: `order-${status}`,
    replyTo: shopInbox() ?? undefined,
    react: OrderEmail({
      ...common,
      address: status === "shipped" ? common.address : undefined,
      preview: intro[0],
      heading: paid ? t("emails.paymentReceived.heading") : t(`order.status.${status}`),
      intro,
      cta: { label: t("emails.viewOrder"), href: url },
    }),
  });
}

async function shopAlert(kind: "newOrder" | "newProof" | "paid", order: Order, origin: string, extra: string[] = []) {
  const to = shopInbox();
  if (!to) return false;
  const t = await translator("sq");
  const total = formatPrice(order.totalCents, "sq");
  const method = t(`checkout.methods.${order.paymentMethod}.label`);
  const subject =
    kind === "newOrder"
      ? t("emails.shop.newOrderSubject", { number: order.number, total })
      : kind === "newProof"
        ? t("emails.shop.newProofSubject", { number: order.number })
        : t("emails.shop.paidSubject", { number: order.number });
  const intro =
    kind === "newOrder"
      ? t("emails.shop.newOrderIntro", { method })
      : kind === "newProof"
        ? t("emails.shop.newProofIntro", { number: order.number })
        : t("emails.shop.paidIntro", { number: order.number });
  const customer = `${t("emails.shop.customer")}: ${order.shippingAddress.firstName} ${order.shippingAddress.lastName} · ${order.email} · ${order.phone}`;
  return sendEmail({
    to,
    subject,
    tag: `shop-${kind}`,
    replyTo: order.email,
    react: SimpleEmail({
      lang: "sq",
      preview: intro,
      label: t("emails.orderNumber", { number: order.number }),
      heading: subject,
      paragraphs: [intro, customer, ...extra],
      // Straight to the order in the admin: measurements, proofs, status and print sheet.
      cta: { label: t("emails.viewOrder"), href: `${origin}/admin/orders/${order.id}` },
      footer: t("emails.footer"),
      siteUrl: `${origin}/sq`,
    }),
  });
}

export const sendShopNewOrder = (order: Order, origin: string) => shopAlert("newOrder", order, origin);
export const sendShopPaid = (order: Order, origin: string) => shopAlert("paid", order, origin);
export async function sendShopNewProof(order: Order, origin: string, reference: string | null, sender: string | null) {
  const t = await translator("sq");
  const extra = [
    reference ? t("emails.shop.reference", { reference }) : null,
    sender ? t("emails.shop.sender", { name: sender }) : null,
  ].filter((x): x is string => Boolean(x));
  return shopAlert("newProof", order, origin, extra);
}

export async function sendNewsletterWelcome(email: string, locale: Locale, origin: string) {
  const t = await translator(locale);
  return sendEmail({
    to: email,
    subject: t("emails.newsletter.subject"),
    tag: "newsletter-welcome",
    react: SimpleEmail({
      lang: locale,
      preview: t("emails.newsletter.preview"),
      heading: t("emails.newsletter.heading"),
      paragraphs: [t("emails.newsletter.text")],
      cta: { label: t("emails.newsletter.cta"), href: origin + getPathname({ locale, href: "/shop" }) },
      footer: t("emails.footer"),
      siteUrl: `${origin}/${locale}`,
    }),
  });
}

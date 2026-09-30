"use server";

import { getLocale } from "next-intl/server";
import { createTranslator } from "next-intl";
import type { Locale } from "@/lib/catalog/types";
import { getProduct } from "@/lib/catalog/repository";
import { pick } from "@/lib/catalog/types";
import { sendEmail, shopInbox } from "@/lib/email/send";
import { siteOrigin } from "@/lib/site-origin";
import { contactSchema } from "@/lib/validation/contact";
import { SimpleEmail } from "@/emails/simple-email";

export type ContactResult = { ok: true } | { ok: false; error: "invalid" | "failure" };

/**
 * Contact form: the atelier gets the message (reply-to the sender), the sender gets a
 * short receipt in her language. A filled honeypot is accepted silently and dropped.
 */
export async function sendContactMessage(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;
  if (v.website) return { ok: true };
  const to = shopInbox();
  if (!to) {
    console.error("[contact] no SHOP_NOTIFICATION_EMAIL or NEXT_PUBLIC_CONTACT_EMAIL configured");
    return { ok: false, error: "failure" };
  }

  const locale = (await getLocale()) as Locale;
  const origin = await siteOrigin();
  const sq = createTranslator({ locale: "sq", messages: (await import("../../../messages/sq.json")).default });
  const own = createTranslator({ locale, messages: (await import(`../../../messages/${locale}.json`)).default });
  const product = v.dress ? await getProduct(v.dress) : null;
  const topic = sq(`pages.contact.topics.${v.topic}`);

  const lines = [
    sq("emails.contact.shopIntro"),
    `${v.name} · ${v.email}${v.phone ? ` · ${v.phone}` : ""}`,
    ...(v.orderNumber ? [`${sq("pages.contact.orderNumber")}: ${v.orderNumber}`] : []),
    ...(product ? [sq("pages.contact.dressNote", { name: pick(product.name, "sq") })] : []),
    `${sq("pages.contact.message")}:`,
    v.message,
  ];
  const shopSent = await sendEmail({
    to,
    replyTo: v.email,
    subject: sq("emails.contact.shopSubject", { name: v.name, topic }),
    tag: "contact",
    react: SimpleEmail({ lang: "sq", preview: v.message.slice(0, 90), label: topic, heading: v.name, paragraphs: lines, footer: sq("emails.footer"), siteUrl: `${origin}/sq` }),
  });
  if (!shopSent) return { ok: false, error: "failure" };

  await sendEmail({
    to: v.email,
    replyTo: to,
    subject: own("emails.contact.receiptSubject"),
    tag: "contact-receipt",
    react: SimpleEmail({
      lang: locale,
      preview: own("emails.contact.receiptText"),
      heading: own("emails.contact.receiptHeading", { name: v.name.split(" ")[0] }),
      paragraphs: [own("emails.contact.receiptText"), `${own("emails.contact.yourMessage")}:`, v.message],
      footer: own("emails.footer"),
      siteUrl: `${origin}/${locale}`,
    }),
  });
  return { ok: true };
}

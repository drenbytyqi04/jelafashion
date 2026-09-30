import { Mail } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { getProduct } from "@/lib/catalog/repository";
import { pageMetadata } from "@/lib/seo";
import { site, whatsappHref } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons/brand-icons";
import { ContactForm } from "@/components/contact/contact-form";
import { MapSlot } from "@/components/contact/map-slot";
import { ContentHeader } from "@/components/content/content-header";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ topic?: string; dress?: string }> };

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return pageMetadata({ locale, href: "/contact", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function ContactPage({ params, searchParams }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const { topic, dress } = await searchParams;
  const t = await getTranslations("pages.contact");
  const product = dress && /^[a-z0-9-]{1,80}$/.test(dress) ? await getProduct(dress) : null;
  const wa = whatsappHref();
  const channel = "flex min-h-11 items-center gap-3 text-body";

  return (
    <>
      <ContentHeader locale={locale} crumbs={[{ name: t("metaTitle"), href: "/contact" }]} label={t("label")} title={t("title")} intro={t("intro")} />
      <div className="container-page grid gap-16 py-16 lg:grid-cols-12 lg:gap-6 lg:py-24">
        <div className="lg:col-span-7">
          <ContactForm topic={topic} dress={product?.slug} dressName={product ? pick(product.name, locale) : null} />
        </div>
        <aside aria-labelledby="channels" className="lg:col-span-4 lg:col-start-9">
          <h2 id="channels" className="label text-stone">
            {t("channels")}
          </h2>
          <ul className="mt-6 flex flex-col divide-y divide-hairline border-y border-hairline">
            <li className="py-4">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener" className={channel}>
                  <WhatsAppIcon size={20} />
                  <span>
                    <span className="link-quiet block">{t("whatsapp")}</span>
                    <span className="block text-small text-stone">{t("whatsappText")}</span>
                  </span>
                </a>
              ) : (
                <p className={channel}>
                  <WhatsAppIcon size={20} /> [PHONE NUMBER]
                </p>
              )}
            </li>
            <li className="py-4">
              {site.email ? (
                <a href={`mailto:${site.email}`} className={channel}>
                  <Mail aria-hidden size={20} strokeWidth={1.25} />
                  <span className="link-quiet">{site.email}</span>
                </a>
              ) : (
                <p className={channel}>
                  <Mail aria-hidden size={20} strokeWidth={1.25} /> [EMAIL]
                </p>
              )}
            </li>
            <li className="py-4">
              <a href={site.instagramUrl} target="_blank" rel="noopener" className={channel}>
                <InstagramIcon size={20} />
                <span className="link-quiet">@{site.instagramHandle}</span>
              </a>
            </li>
          </ul>
          <dl className="mt-8 grid gap-6 text-small">
            <div>
              <dt className="label text-stone">{t("visitTitle")}</dt>
              <dd className="mt-2 text-body">{t("address")}</dd>
            </div>
            <div>
              <dt className="label text-stone">{t("hoursTitle")}</dt>
              <dd className="mt-2 text-body">{t("hours")}</dd>
            </div>
          </dl>
          <div className="mt-8">
            <MapSlot label={t("showMap")} note={t("mapNote")} title={t("mapTitle")} />
          </div>
        </aside>
      </div>
    </>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata } from "@/lib/seo";
import { CookieSettingsButton } from "@/components/consent/cookie-settings-button";
import { ContentHeader } from "@/components/content/content-header";

type Props = { params: Promise<{ locale: string }> };
type Group = { title: string; text: string; rows: [string, string][] };

export async function generateMetadata({ params }: Props) {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "pages.cookies" });
  return pageMetadata({ locale, href: "/cookies", title: t("metaTitle"), description: t("metaDescription") });
}

export default async function CookiesPage({ params }: Props) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("pages.cookies");
  const groups = t.raw("groups") as Group[];
  return (
    <>
      <ContentHeader locale={locale} crumbs={[{ name: t("metaTitle"), href: "/cookies" }]} label={t("label")} title={t("title")} intro={t("intro")}>
        <CookieSettingsButton label={t("change")} />
      </ContentHeader>
      <div className="container-page pb-16 lg:pb-24">
        {groups.map((g) => (
          <section key={g.title} className="grid gap-4 border-b border-hairline py-12 lg:grid-cols-12 lg:gap-6 lg:py-16">
            <div className="lg:col-span-4">
              <h2 className="font-serif text-h3">{g.title}</h2>
              <p className="mt-3 text-small text-stone">{g.text}</p>
            </div>
            <div className="overflow-x-auto lg:col-span-7 lg:col-start-6">
              <table className="w-full border-collapse text-small">
                <thead>
                  <tr className="border-b border-ink text-left">
                    <th scope="col" className="label py-3 pr-4 font-medium">{t("name")}</th>
                    <th scope="col" className="label py-3 font-medium">{t("purpose")}</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map(([name, purpose]) => (
                    <tr key={name} className="border-b border-hairline align-top">
                      <th scope="row" className="py-3 pr-4 text-left font-mono text-[0.8125rem] font-normal">{name}</th>
                      <td className="py-3 text-stone">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

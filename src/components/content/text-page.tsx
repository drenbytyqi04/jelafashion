import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { pageMetadata, type StaticHref } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { ContentHeader } from "./content-header";
import { ProseSections, type ProseSection } from "./prose-sections";

export type TextPageKey = "privacy" | "terms" | "returns";
const HREF: Record<TextPageKey, StaticHref> = { privacy: "/privacy", terms: "/terms", returns: "/returns" };

export async function textPageMetadata(locale: Locale, key: TextPageKey) {
  const t = await getTranslations({ locale, namespace: `pages.${key}` });
  return pageMetadata({ locale, href: HREF[key], title: t("metaTitle"), description: t("metaDescription") });
}

/** Policy pages: header plus sections. Unconfirmed terms stay visible [PLACEHOLDERS]. */
export async function TextPage({ locale, pageKey }: { locale: Locale; pageKey: TextPageKey }) {
  const t = await getTranslations(`pages.${pageKey}`);
  const tp = await getTranslations("pages");
  const updated = t.has("updated") ? t("updated") : null;
  return (
    <>
      <ContentHeader locale={locale} crumbs={[{ name: t("metaTitle"), href: HREF[pageKey] }]} label={t("label")} title={t("title")} intro={t("intro")}>
        {updated && <p className="text-small text-stone">{updated}</p>}
      </ContentHeader>
      <ProseSections
        sections={t.raw("sections") as ProseSection[]}
        footer={
          <Button asChild variant="secondary">
            <Link href="/contact">{tp("faq.moreCta")}</Link>
          </Button>
        }
        className="pb-16 lg:pb-24"
      />
    </>
  );
}

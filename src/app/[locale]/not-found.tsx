import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="container-page flex min-h-[80svh] flex-col justify-center pb-24 pt-[calc(var(--header-h)+64px)]">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 lg:col-start-2">
          <span aria-hidden className="mb-10 block h-px w-24 bg-champagne" />
          <h1 className="font-serif text-h1 font-light">{t("title")}</h1>
          <p className="measure mt-6 text-lead font-serif text-stone">{t("text")}</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/shop">{t("shop")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">{t("home")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

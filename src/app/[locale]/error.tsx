"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("error");
  return (
    <section className="container-page flex min-h-[80svh] flex-col justify-center pb-24 pt-[calc(var(--header-h)+64px)]">
      <div className="lg:ml-[8.33%] lg:w-7/12">
        <span aria-hidden className="mb-10 block h-px w-24 bg-champagne" />
        <h1 className="font-serif text-h1 font-light">{t("title")}</h1>
        <p className="measure mt-6 font-serif text-lead text-stone">{t("text")}</p>
        <Button className="mt-10" onClick={reset}>
          {t("retry")}
        </Button>
      </div>
    </section>
  );
}

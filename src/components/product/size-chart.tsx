"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { SIZE_CHART } from "@/lib/catalog/size-chart";
import { cn } from "@/lib/cn";
import { formatMeasure, toUnit, type Unit } from "@/lib/units";

/** Unit switch + standard size table; shared by the size guide drawer and page. */
export function SizeChart({ className }: { className?: string }) {
  const t = useTranslations("sizeGuide");
  const locale = useLocale() as "sq" | "en";
  const [unit, setUnit] = useState<Unit>("cm");
  const name = useId();
  const fmt = (cm: number) => formatMeasure(toUnit(cm, unit), locale);

  return (
    <div className={className}>
      <fieldset>
        <legend className="label mb-3 text-stone">{t("unit")}</legend>
        <div className="inline-grid grid-cols-2 border border-field">
          {(["cm", "in"] as const).map((u) => (
            <label
              key={u}
              className={cn(
                "flex min-h-11 min-w-20 cursor-pointer items-center justify-center px-4 text-small transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-1 has-[:focus-visible]:-outline-offset-4 has-[:focus-visible]:outline-current",
                unit === u ? "bg-ink text-ivory" : "hover:bg-linen",
              )}
            >
              <input type="radio" name={name} value={u} checked={unit === u} onChange={() => setUnit(u)} className="sr-only" />
              {t(u)}
            </label>
          ))}
        </div>
      </fieldset>

      <table className="nums mt-8 w-full border-collapse text-small">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="border-b border-ink text-left">
            <th scope="col" className="label py-3 font-medium">{t("size")}</th>
            <th scope="col" className="label py-3 font-medium">{t("eu")}</th>
            <th scope="col" className="label py-3 text-right font-medium">{t("bust")}</th>
            <th scope="col" className="label py-3 text-right font-medium">{t("waist")}</th>
            <th scope="col" className="label py-3 text-right font-medium">{t("hips")}</th>
          </tr>
        </thead>
        <tbody>
          {SIZE_CHART.map((r) => (
            <tr key={r.size} className="border-b border-hairline">
              <th scope="row" className="py-3 text-left font-medium">{r.size}</th>
              <td className="py-3 text-stone">{r.eu}</td>
              <td className="py-3 text-right">{fmt(r.bust)}</td>
              <td className="py-3 text-right">{fmt(r.waist)}</td>
              <td className="py-3 text-right">{fmt(r.hips)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

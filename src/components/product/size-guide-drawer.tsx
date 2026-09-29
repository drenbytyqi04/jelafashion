"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { SIZE_CHART } from "@/lib/catalog/size-chart";
import { cn } from "@/lib/cn";
import { formatMeasure, toUnit, type Unit } from "@/lib/units";
import { Drawer } from "@/components/ui/drawer";

export function SizeGuideDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sizeGuide");
  const locale = useLocale() as "sq" | "en";
  const [unit, setUnit] = useState<Unit>("cm");
  const fmt = (cm: number) => formatMeasure(toUnit(cm, unit), locale);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={t("title")} description={t("text")}>
      <fieldset>
        <legend className="label mb-3 text-stone">{t("unit")}</legend>
        <div className="inline-grid grid-cols-2 border border-field">
          {(["cm", "in"] as const).map((u) => (
            <label
              key={u}
              className={cn(
                "flex min-h-11 min-w-20 items-center justify-center px-4 text-small transition-colors",
                unit === u ? "bg-ink text-ivory" : "hover:bg-linen",
              )}
            >
              <input type="radio" name="size-guide-unit" value={u} checked={unit === u} onChange={() => setUnit(u)} className="sr-only" />
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

      <h3 className="label mt-10 font-sans text-stone">{t("howTo")}</h3>
      <dl className="mt-3 flex flex-col gap-3 text-small">
        {(["bust", "waist", "hips"] as const).map((k) => (
          <div key={k}>
            <dt className="font-medium">{t(k)}</dt>
            <dd className="text-stone">{t(`howTo${k[0].toUpperCase()}${k.slice(1)}` as "howToBust")}</dd>
          </div>
        ))}
      </dl>
    </Drawer>
  );
}

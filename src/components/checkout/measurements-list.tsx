"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Bilingual, Locale } from "@/lib/catalog/types";
import { formatMeasure, toUnit, type Unit } from "@/lib/units";

export function MeasurementsList({
  measurements,
  unit = "cm",
  notes,
}: {
  measurements: { id: string; cm: number; label?: Bilingual }[];
  unit?: Unit;
  notes?: string | null;
}) {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const unitLabel = unit === "cm" ? "cm" : locale === "sq" ? "inç" : "in";
  return (
    <>
      <dl className="nums grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-l border-champagne pl-3 text-small">
        {measurements.map((m) => (
          <div key={m.id} className="contents">
            <dt className="text-stone">{m.label ? m.label[locale] : m.id}</dt>
            <dd className="whitespace-nowrap text-right">
              {formatMeasure(toUnit(m.cm, unit), locale)} {unitLabel}
            </dd>
          </div>
        ))}
      </dl>
      {notes && <p className="mt-4 text-small text-stone">{t("notes", { notes })}</p>}
    </>
  );
}

"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AVAILABILITY,
  CATEGORIES,
  LENGTHS,
  PRICE_BANDS,
  SLEEVES,
  type FilterKey,
  type Filters,
} from "@/lib/catalog/filters";
import { cn } from "@/lib/cn";

export type FilterOptionCounts = Partial<Record<FilterKey, Record<string, number>>>;

/** Checkbox groups for every filter. Shared by the desktop sidebar and the mobile drawer. */
export function FilterGroups({
  filters,
  onToggle,
  colorOptions,
  showCategory,
  counts,
  idPrefix,
}: {
  filters: Filters;
  onToggle: (key: FilterKey, value: string) => void;
  colorOptions: { family: string; hex: string }[];
  showCategory: boolean;
  counts: FilterOptionCounts;
  idPrefix: string;
}) {
  const t = useTranslations("collection");

  const groups: { key: FilterKey; values: readonly string[] }[] = [
    ...(showCategory ? [{ key: "category" as const, values: CATEGORIES }] : []),
    { key: "color", values: colorOptions.map((c) => c.family) },
    { key: "length", values: LENGTHS },
    { key: "sleeves", values: SLEEVES },
    { key: "price", values: PRICE_BANDS },
    { key: "availability", values: AVAILABILITY },
  ];

  return (
    <div className="flex flex-col">
      {groups.map(({ key, values }) => (
        <fieldset key={key} className="border-t border-hairline py-5 first:border-t-0 first:pt-0">
          <legend className="label mb-3 float-left w-full text-stone">{t(`groups.${key}`)}</legend>
          <ul className={cn("clear-both", key === "color" ? "grid grid-cols-2 gap-x-4" : "flex flex-col")}>
            {values.map((value) => {
              const id = `${idPrefix}-${key}-${value}`;
              const checked = (filters[key] as string[]).includes(value);
              const count = counts[key]?.[value] ?? 0;
              const disabled = count === 0 && !checked;
              const swatch = key === "color" ? colorOptions.find((c) => c.family === value)?.hex : undefined;
              return (
                <li key={value}>
                  <label
                    htmlFor={id}
                    className={cn(
                      "group flex min-h-11 items-center gap-3 text-small",
                      disabled ? "cursor-not-allowed text-stone/70" : "text-ink",
                    )}
                  >
                    <span className="relative flex size-5 shrink-0 items-center justify-center">
                      <input
                        id={id}
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => onToggle(key, value)}
                        className={cn(
                          "peer absolute inset-0 appearance-none border transition-colors duration-(--duration-micro)",
                          swatch ? "rounded-full border-ink/25 checked:border-ink" : "border-field checked:border-ink checked:bg-ink",
                          !disabled && "group-hover:border-ink",
                        )}
                        style={swatch ? { background: swatch } : undefined}
                      />
                      {swatch ? (
                        <span
                          aria-hidden
                          className="pointer-events-none absolute -inset-[3px] rounded-full border border-ink opacity-0 peer-checked:opacity-100"
                        />
                      ) : (
                        <Check
                          aria-hidden
                          size={14}
                          strokeWidth={1.5}
                          className="pointer-events-none relative text-champagne opacity-0 peer-checked:opacity-100"
                        />
                      )}
                    </span>
                    <span className="flex-1">{t(`${key}.${value}` as never)}</span>
                    <span className="nums text-stone">{count}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}

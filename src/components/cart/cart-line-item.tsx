"use client";

import { ChevronDown, Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { formatMeasure, toUnit } from "@/lib/units";
import { MAX_QUANTITY, useCartStore, type CartLine } from "@/stores/cart";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

export function CartLineItem({ line, compact, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale() as Locale;
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const [showMeasures, setShowMeasures] = useState(false);
  const tableId = useId();
  const href = { pathname: "/dress/[slug]" as const, params: { slug: line.slug } };
  const unit = line.unit ?? "cm";
  const unitLabel = unit === "cm" ? "cm" : locale === "sq" ? "inç" : "in";
  const custom = line.size === "custom";

  return (
    <article className={cn("grid gap-4", compact ? "grid-cols-[72px_1fr]" : "grid-cols-[96px_1fr] md:grid-cols-[120px_1fr]")}>
      <Link href={href} onClick={onNavigate} className="block" tabIndex={-1} aria-hidden>
        {line.image ? (
          <div className="relative aspect-[3/4] overflow-hidden bg-linen">
            <Image src={line.image} alt="" fill sizes="120px" className="object-cover" />
          </div>
        ) : (
          <ImagePlaceholder ratio="3/4" tint={line.colorHex} />
        )}
      </Link>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-[1.25rem] leading-tight">
            <Link href={href} onClick={onNavigate}>
              {line.name}
            </Link>
          </h3>
          <p className="nums shrink-0 font-serif text-price">{formatPrice(Math.round(line.priceEUR * 100) * line.quantity, locale)}</p>
        </div>
        <p className="mt-1 text-small text-stone">
          {line.color && <>{t("colorLine", { color: line.color })} · </>}
          {custom ? t("customSize") : t("size", { size: line.size })}
        </p>
        {line.quantity > 1 && (
          <p className="nums text-small text-stone">{t("each", { price: formatPrice(Math.round(line.priceEUR * 100), locale) })}</p>
        )}

        {custom && line.measurements && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowMeasures((v) => !v)}
              aria-expanded={showMeasures}
              aria-controls={tableId}
              className="flex min-h-11 items-center gap-1 text-small"
            >
              <span className="link-underline">{showMeasures ? t("hideMeasurements") : t("viewMeasurements")}</span>
              <ChevronDown aria-hidden size={16} strokeWidth={1.25} className={cn("transition-transform duration-(--duration-ui)", showMeasures && "rotate-180")} />
            </button>
            <div id={tableId} hidden={!showMeasures}>
              <dl className="nums mt-1 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-l border-champagne pl-3 text-small">
                {line.measurements.map((m) => (
                  <div key={m.id} className="contents">
                    <dt className="text-stone">{m.label ? m.label[locale] : m.id}</dt>
                    <dd className="text-right">
                      {formatMeasure(toUnit(m.cm, unit), locale)} {unitLabel}
                    </dd>
                  </div>
                ))}
              </dl>
              {line.notes && <p className="mt-2 text-small text-stone">{t("notes", { notes: line.notes })}</p>}
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-4 pt-3">
          <div className="flex items-center border border-field" role="group" aria-label={t("quantityLabel")}>
            <button
              type="button"
              onClick={() => setQuantity(line.key, line.quantity - 1)}
              aria-label={t("decrease", { name: line.name })}
              className="flex size-11 items-center justify-center"
            >
              <Minus aria-hidden size={14} strokeWidth={1.25} />
            </button>
            <span className="nums w-8 text-center text-small" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(line.key, line.quantity + 1)}
              disabled={line.quantity >= MAX_QUANTITY}
              aria-label={t("increase", { name: line.name })}
              className="flex size-11 items-center justify-center disabled:opacity-40"
            >
              <Plus aria-hidden size={14} strokeWidth={1.25} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => remove(line.key)}
            aria-label={t("remove", { name: line.name })}
            className="flex min-h-11 min-w-11 items-center justify-center gap-1 text-small text-stone hover:text-ink"
          >
            <X aria-hidden size={14} strokeWidth={1.25} />
            <span className="max-md:sr-only">{tc("remove")}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useTransition, type FormEvent } from "react";
import { checkDiscount } from "@/app/actions/checkout";
import type { Locale } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import type { Discount } from "@/lib/commerce/types";
import { formatPrice } from "@/lib/format";
import type { CartLine } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { MeasurementsList } from "./measurements-list";

export type Totals = { subtotalCents: number; discountCents: number; shippingCents: number | null; totalCents: number };

export function SummaryLines({ lines }: { lines: CartLine[] }) {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState<CartLine | null>(null);

  return (
    <>
      <ul className="flex flex-col divide-y divide-hairline">
        {lines.map((l) => (
          <li key={l.key} className="grid grid-cols-[64px_1fr_auto] gap-4 py-4 first:pt-0">
            <div className="relative">
              {l.image ? (
                <div className="relative aspect-[3/4] overflow-hidden bg-blush">
                  <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />
                </div>
              ) : (
                <ImagePlaceholder ratio="3/4" tint={l.colorHex} tone="blush" />
              )}
              <span className="nums absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-ivory">
                <span className="sr-only">{t("quantityLabel")}: </span>
                {l.quantity}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-serif text-[1.125rem] leading-tight">{l.name}</p>
              <p className="mt-1 text-small text-stone">
                {l.color && <>{l.color} · </>}
                {l.size === "custom" ? t("customSize") : t("size", { size: l.size })}
              </p>
              {l.size === "custom" && l.measurements && (
                <button type="button" onClick={() => setOpen(l)} className="flex min-h-11 items-center text-small">
                  <span className="link-underline">{t("viewMeasurements")}</span>
                </button>
              )}
            </div>
            <p className="nums text-small">{formatPrice(Math.round(l.priceEUR * 100) * l.quantity, locale)}</p>
          </li>
        ))}
      </ul>
      <Drawer
        open={open !== null}
        onOpenChange={(v) => !v && setOpen(null)}
        title={open?.name ?? ""}
        description={t("customSize")}
      >
        {open?.measurements && <MeasurementsList measurements={open.measurements} unit={open.unit} notes={open.notes} />}
      </Drawer>
    </>
  );
}

export function DiscountField({
  subtotalCents,
  applied,
  onApply,
}: {
  subtotalCents: number;
  applied: Discount | null;
  onApply: (d: Discount | null) => void;
}) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const id = useId();

  function submit(e: FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await checkDiscount(value);
      if (!res.ok) return setError(t(res.error === "unavailable" ? "errors.unavailable" : "discountInvalid"));
      if (subtotalCents < res.discount.minSubtotalCents) {
        return setError(t("discountMin", { amount: formatPrice(res.discount.minSubtotalCents, locale) }));
      }
      setError(null);
      setCode("");
      onApply(res.discount);
    });
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between gap-4">
        <p className="text-small" role="status">
          {t("discountApplied", { code: applied.code })}
        </p>
        <button
          type="button"
          onClick={() => onApply(null)}
          aria-label={t("removeCode", { code: applied.code })}
          className="-mr-3 flex size-11 items-center justify-center text-stone hover:text-ink"
        >
          <X aria-hidden size={18} strokeWidth={1.25} />
        </button>
      </div>
    );
  }

  // Its own small form, nested visually but not in the DOM, so Enter applies the code
  // instead of placing the order.
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={id} className="mb-2 block text-small">
        {t("discount")}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={32}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 min-w-0 flex-1 border border-field bg-ivory px-4 text-body uppercase placeholder:normal-case hover:border-ink aria-invalid:border-error"
        />
        <Button type="submit" variant="secondary" size="sm" loading={pending}>
          {t("apply")}
        </Button>
      </div>
      <p id={`${id}-error`} role="alert" className={cn("text-small text-error", error ? "mt-2" : "sr-only")}>
        {error}
      </p>
    </form>
  );
}

export function TotalsTable({ totals, discountCode, className }: { totals: Totals; discountCode?: string; className?: string }) {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  return (
    <dl className={cn("nums flex flex-col gap-2 text-small", className)}>
      <div className="flex justify-between gap-4">
        <dt>{t("subtotal")}</dt>
        <dd>{formatPrice(totals.subtotalCents, locale)}</dd>
      </div>
      {totals.discountCents > 0 && (
        <div className="flex justify-between gap-4">
          <dt>{t("discountLine", { code: discountCode ?? "" })}</dt>
          <dd>-{formatPrice(totals.discountCents, locale)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt>{t("shippingLine")}</dt>
        <dd className={cn(totals.shippingCents === null && "text-stone")}>
          {totals.shippingCents === null
            ? t("shippingPending")
            : totals.shippingCents === 0
              ? t("shippingFree")
              : formatPrice(totals.shippingCents, locale)}
        </dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-hairline pt-4">
        <dt className="text-body">{t("total")}</dt>
        <dd className="font-serif text-price">
          <span className="mr-2 align-middle text-[0.6875rem] tracking-[0.12em] text-stone">EUR</span>
          {formatPrice(totals.totalCents, locale)}
        </dd>
      </div>
    </dl>
  );
}

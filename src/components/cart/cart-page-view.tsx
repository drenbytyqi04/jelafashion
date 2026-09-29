"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CartLineItem } from "./cart-line-item";
import { useCartHydrated } from "./use-cart-hydrated";

export function CartPageView() {
  const t = useTranslations("cart");
  const locale = useLocale() as Locale;
  const hydrated = useCartHydrated();
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);

  return (
    <section className="container-page pb-24 pt-[calc(var(--header-h)+40px)] lg:pb-32 lg:pt-[calc(var(--header-h)+64px)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-hairline pb-6">
        <h1 className="font-serif text-h1 font-light">{t("pageTitle")}</h1>
        {hydrated && count > 0 && <p className="nums text-small text-stone">{t("items", { count })}</p>}
      </div>

      {!hydrated ? (
        <div aria-hidden className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            {[0, 1].map((i) => (
              <div key={i} className="grid grid-cols-[120px_1fr] gap-4">
                <Skeleton className="aspect-[3/4]" />
                <div>
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="mt-3 h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : count === 0 ? (
        <div className="max-w-xl py-16">
          <p className="font-serif text-h3">{t("empty")}</p>
          <p className="mt-3 text-body text-stone">{t("emptyText")}</p>
          <Button asChild variant="secondary" className="mt-8">
            <Link href="/shop">{t("emptyCta")}</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-6">
          <ul className="flex flex-col divide-y divide-hairline lg:col-span-7">
            {lines.map((l) => (
              <li key={l.key} className="py-6 first:pt-0">
                <CartLineItem line={l} />
              </li>
            ))}
          </ul>
          <aside className="lg:col-span-4 lg:col-start-9">
            <div className="bg-linen p-6 lg:sticky lg:top-[calc(var(--header-offset)+32px)] lg:p-8">
              <div className="flex items-baseline justify-between">
                <span className="text-small">{t("subtotal")}</span>
                <span className="nums font-serif text-price">{formatPrice(Math.round(subtotal * 100), locale)}</span>
              </div>
              <p className="mt-3 text-small text-stone">{t("shippingNote")}</p>
              <Button asChild className="mt-6 w-full">
                <Link href="/checkout">{t("checkoutCta")}</Link>
              </Button>
              <Button asChild variant="text" className="mt-4">
                <Link href="/shop">{t("continue")}</Link>
              </Button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

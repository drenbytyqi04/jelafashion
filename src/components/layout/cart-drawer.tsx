"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { categoryNav } from "@/lib/nav";
import type { Locale } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { CartLineItem } from "@/components/cart/cart-line-item";

export function CartDrawer() {
  const t = useTranslations("cart");
  const tn = useTranslations("nav");
  const locale = useLocale() as Locale;
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  const close = () => setOpen(false);

  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      title={count > 0 ? `${t("title")} (${count})` : t("title")}
      footer={
        count > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="text-small">{t("subtotal")}</span>
              <span className="nums font-serif text-price">{formatPrice(Math.round(subtotal * 100), locale)}</span>
            </div>
            <p className="text-small text-stone">{t("shippingNote")}</p>
            <Button asChild className="w-full">
              <Link href="/checkout" onClick={close}>
                {t("checkoutCta")}
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/cart" onClick={close}>
                {t("viewCart")}
              </Link>
            </Button>
          </div>
        ) : undefined
      }
    >
      {count === 0 ? (
        <div className="flex h-full flex-col justify-center pb-16">
          <span aria-hidden className="mb-8 block h-px w-12 bg-champagne" />
          <p className="font-serif text-h3">{t("empty")}</p>
          <p className="mt-3 text-body text-stone">{t("emptyText")}</p>
          {/* Straight into a collection, rather than a dead end */}
          <ul className="mt-8 flex flex-col border-t border-hairline">
            {categoryNav.map((c) => (
              <li key={c.key} className="border-b border-hairline">
                <Link href={c.href} onClick={close} className="group flex min-h-14 items-center justify-between font-serif text-[1.375rem]">
                  {tn(c.key)}
                  <ArrowRight
                    aria-hidden
                    size={18}
                    strokeWidth={1.25}
                    className="transition-transform duration-(--duration-ui) ease-(--ease-couture) group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <Button asChild variant="secondary" className="mt-8 self-start">
            <Link href="/shop" onClick={close}>
              {t("emptyCta")}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline">
          {lines.map((l, i) => (
            // Lines settle in one after another as the drawer opens.
            <li key={l.key} className="animate-rise-in py-5 first:pt-0" style={{ animationDelay: `${120 + Math.min(i, 5) * 60}ms` }}>
              <CartLineItem line={l} compact onNavigate={close} />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

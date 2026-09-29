"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import { selectCartCount, selectCartSubtotal, useCartStore } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { CartLineItem } from "@/components/cart/cart-line-item";

export function CartDrawer() {
  const t = useTranslations("cart");
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
        <div className="flex h-full flex-col items-start justify-center gap-4 pb-16">
          <p className="font-serif text-h3">{t("empty")}</p>
          <p className="text-body text-stone">{t("emptyText")}</p>
          <Button asChild variant="secondary" className="mt-4">
            <Link href="/shop" onClick={close}>
              {t("emptyCta")}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline">
          {lines.map((l) => (
            <li key={l.key} className="py-5 first:pt-0">
              <CartLineItem line={l} compact onNavigate={close} />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

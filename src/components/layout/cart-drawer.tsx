"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { selectCartCount, useCartStore } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

// Phase 1: shell with the empty state and a plain line list. Phase 3 adds images,
// quantity controls, custom-size details and the fly-to-cart hand-off.
export function CartDrawer() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const open = useUiStore((s) => s.cartOpen);
  const setOpen = useUiStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const count = useCartStore(selectCartCount);
  const subtotal = lines.reduce((n, l) => n + l.priceEUR * l.quantity, 0);
  const eur = { format: (v: number) => formatPrice(Math.round(v * 100), locale as "sq" | "en") };

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
              <span className="nums font-serif text-price">{eur.format(subtotal)}</span>
            </div>
            <Button asChild className="w-full">
              <Link href="/cart" onClick={() => setOpen(false)}>
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
            <Link href="/shop" onClick={() => setOpen(false)}>
              {t("emptyCta")}
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-hairline">
          {lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-4 py-4">
              <div>
                <p className="font-serif text-[1.25rem]">{l.name}</p>
                <p className="text-small text-stone">
                  {t("size", { size: l.size })} · {t("quantity", { count: l.quantity })}
                </p>
              </div>
              <p className="nums shrink-0 font-serif text-price">{eur.format(l.priceEUR * l.quantity)}</p>
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}

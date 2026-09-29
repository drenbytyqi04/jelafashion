"use client";

import { Heart, Plus, Ruler } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import type { CatalogProduct, Locale, Size } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { useCartStore } from "@/stores/cart";
import { toast } from "@/stores/toast";
import { useUiStore } from "@/stores/ui";
import { useWishlistStore } from "@/stores/wishlist";
import { ProductMedia } from "./product-media";

export function ProductCard({
  product,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  className,
}: {
  product: CatalogProduct;
  /** next/image sizes for the grid this card sits in. */
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const t = useTranslations("product");
  const locale = useLocale() as Locale;
  const name = pick(product.name, locale);
  const href = { pathname: "/dress/[slug]" as const, params: { slug: product.slug } };
  const saved = useWishlistStore((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const [picking, setPicking] = useState(false);
  const addToCart = useCartStore((s) => s.add);
  const openCart = useUiStore((s) => s.setCartOpen);

  function add(size: Size) {
    const color = product.colors[0];
    addToCart({
      key: `${product.id}-${size}-${color?.id ?? "default"}`,
      productId: product.id,
      name,
      priceEUR: product.priceCents / 100,
      size,
      color: color ? pick(color.name, locale) : undefined,
    });
    setPicking(false);
    toast({ title: t("added"), description: t("addedText", { name, size }), tone: "success" });
    openCart(true);
  }

  const hasSecond = product.images.length > 1 || product.images.length === 0;

  return (
    <article className={cn("group relative", className)} onMouseLeave={() => setPicking(false)}>
      <div className="relative overflow-hidden">
        <Link href={href} className="block" aria-label={name}>
          <div className="transition-transform duration-[1200ms] ease-(--ease-couture) group-hover:scale-[1.04] motion-reduce:transition-none">
            <ProductMedia product={product} locale={locale} sizes={sizes} priority={priority} />
          </div>
          {hasSecond && (
            <div
              aria-hidden
              className="absolute inset-0 opacity-0 transition-opacity duration-[600ms] ease-(--ease-couture) [@media(hover:hover)]:group-hover:opacity-100"
            >
              <ProductMedia product={product} locale={locale} index={1} sizes={sizes} />
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={saved}
          aria-label={saved ? t("removeFromWishlist", { name }) : t("saveToWishlist", { name })}
          className="absolute right-1 top-1 flex size-11 items-center justify-center text-ink"
        >
          <Heart aria-hidden size={20} strokeWidth={1.25} className={cn(saved && "fill-ink")} />
        </button>

        {/* Quick add: slides up on hover (desktop) and on keyboard focus */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 hidden translate-y-full bg-ivory/95 transition-transform duration-(--duration-ui) ease-(--ease-couture)",
            "[@media(hover:hover)]:block group-hover:translate-y-0 focus-within:translate-y-0",
            picking && "translate-y-0",
          )}
        >
          {picking ? (
            <div className="p-3">
              <p className="label mb-2 text-stone">{t("chooseSize")}</p>
              <ul className="grid grid-cols-6 gap-1">
                {product.sizes.map(({ size, stock }) => {
                  const unavailable = product.availability === "in_stock" && stock === 0;
                  return (
                    <li key={size}>
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => add(size)}
                        aria-label={unavailable ? t("outOfStock", { size }) : size}
                        className="label flex h-9 w-full items-center justify-center border border-field text-[0.6875rem] tracking-[0.08em] hover:border-ink disabled:border-hairline disabled:text-stone disabled:line-through"
                      >
                        {size}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={href}
                className="mt-2 flex min-h-9 items-center gap-2 text-small text-ink"
                title={t("customSizeHint")}
              >
                <Ruler aria-hidden size={16} strokeWidth={1.25} />
                <span className="link-quiet">{t("customSize")}</span>
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPicking(true)}
              aria-label={t("quickAddTo", { name })}
              className="label flex h-11 w-full items-center justify-center gap-2"
            >
              <Plus aria-hidden size={14} strokeWidth={1.25} />
              {t("quickAdd")}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-[1.25rem] leading-tight">
            <Link href={href} tabIndex={-1}>
              {name}
            </Link>
          </h3>
          {product.colors.length > 0 && (
            <ul className="mt-2 flex gap-1.5" aria-label={t("colors", { count: product.colors.length })}>
              {product.colors.map((c) => (
                <li key={c.id}>
                  <span
                    title={pick(c.name, locale)}
                    className="block size-2.5 rounded-full border border-ink/20"
                    style={{ background: c.hex }}
                  />
                  <span className="sr-only">{pick(c.name, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="nums shrink-0 font-serif text-price">
          <span className="sr-only">{t("priceLabel")}: </span>
          {formatPrice(product.priceCents, locale)}
        </p>
      </div>
    </article>
  );
}

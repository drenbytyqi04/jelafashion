"use client";

import { Heart, Plus, Ruler, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import type { CatalogProduct, Locale, Size } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { lineKey, useCartStore } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { productItem, track } from "@/lib/tracking/track";
import { useWishlistStore } from "@/stores/wishlist";
import { ProductMedia } from "./product-media";

/** A dress reads as "New" for this long after it is published. */
const NEW_FOR_DAYS = 30;
const noopSubscribe = () => () => {};

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
      key: lineKey(product.id, size, color?.id),
      productId: product.id,
      slug: product.slug,
      name,
      priceEUR: product.priceCents / 100,
      size,
      color: color ? pick(color.name, locale) : undefined,
      colorHex: color?.hex,
      image: product.images[0]?.url,
    });
    setPicking(false);
    track({ name: "add_to_cart", item: productItem(product, name, size) });
    // The drawer is the confirmation: it shows the dress, and a toast would cover its button.
    openCart(true);
  }

  const hasSecond = product.images.length > 1 || product.images.length === 0;
  // Client-only: a cached or prerendered page can be older than the visit, so a dress may
  // have stopped being "new" in between. The server renders no label; hydration adds it.
  const isNew = useSyncExternalStore(
    noopSubscribe,
    () => Date.now() - Date.parse(product.publishedAt) < NEW_FOR_DAYS * 86_400_000,
    () => false,
  );

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

        {isNew && !picking && (
          <span className="label pointer-events-none absolute left-3 top-3 bg-ivory/90 px-2 py-1 text-[0.625rem] tracking-[0.2em]">
            {t("newBadge")}
          </span>
        )}

        <button
          type="button"
          onClick={() => {
            if (!saved) track({ name: "add_to_wishlist", item: productItem(product, name) });
            toggleWishlist(product.id);
          }}
          aria-pressed={saved}
          aria-label={saved ? t("removeFromWishlist", { name }) : t("saveToWishlist", { name })}
          className="absolute right-1 top-1 flex size-11 items-center justify-center text-ink"
        >
          <Heart aria-hidden size={20} strokeWidth={1.25} className={cn(saved && "fill-ink")} />
        </button>

        {/* Touch: a "+" opens the same size picker the hover panel shows on desktop. */}
        {!picking && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            aria-label={t("quickAddTo", { name })}
            className="absolute bottom-1 right-1 flex size-11 items-center justify-center [@media(hover:hover)]:hidden"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-ivory/90 text-ink">
              <Plus aria-hidden size={16} strokeWidth={1.25} />
            </span>
          </button>
        )}

        {/* Quick add: slides up on hover (desktop) and on keyboard focus */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 hidden translate-y-full bg-ivory/95 transition-transform duration-(--duration-ui) ease-(--ease-couture)",
            "[@media(hover:hover)]:block group-hover:translate-y-0 focus-within:translate-y-0",
            picking && "block translate-y-0 bg-ivory",
          )}
        >
          {picking ? (
            <div className="p-2.5 [@media(hover:hover)]:p-3">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="label whitespace-nowrap text-[0.625rem] text-stone [@media(hover:hover)]:text-label">{t("chooseSize")}</p>
                <button
                  type="button"
                  onClick={() => setPicking(false)}
                  aria-label={t("closeQuickAdd")}
                  className="-my-3 -mr-3 flex size-11 items-center justify-center text-stone hover:text-ink [@media(hover:hover)]:hidden"
                >
                  <X aria-hidden size={16} strokeWidth={1.25} />
                </button>
              </div>
              <ul className="grid grid-cols-3 gap-1 [@media(hover:hover)]:grid-cols-6">
                {product.sizes.map(({ size, stock }) => {
                  const unavailable = product.availability === "in_stock" && stock === 0;
                  return (
                    <li key={size}>
                      <button
                        type="button"
                        disabled={unavailable}
                        onClick={() => add(size)}
                        aria-label={unavailable ? t("outOfStock", { size }) : size}
                        className="label flex h-11 w-full items-center justify-center border border-field [@media(hover:hover)]:h-9 text-[0.6875rem] tracking-[0.08em] hover:border-ink disabled:border-hairline disabled:text-stone disabled:line-through"
                      >
                        {size}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={href}
                className="mt-1 flex min-h-11 items-center gap-1.5 text-[0.8125rem] text-ink [@media(hover:hover)]:mt-2 [@media(hover:hover)]:min-h-9 [@media(hover:hover)]:gap-2 [@media(hover:hover)]:text-small"
                title={t("customSizeHint")}
              >
                <Ruler aria-hidden size={16} strokeWidth={1.25} className="shrink-0" />
                <span className="link-quiet truncate [@media(hover:hover)]:hidden">{t("customSizeShort")}</span>
                <span className="link-quiet hidden truncate [@media(hover:hover)]:inline">{t("customSize")}</span>
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

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="min-w-0 truncate font-serif text-[1.25rem] leading-tight lg:text-[1.375rem]">
          <Link href={href} tabIndex={-1}>
            {name}
          </Link>
        </h3>
        <p className="nums shrink-0 font-serif text-price">
          <span className="sr-only">{t("priceLabel")}: </span>
          {formatPrice(product.priceCents, locale)}
        </p>
      </div>
      <div className="mt-2 flex min-h-3 items-center justify-between gap-3">
        {product.colors.length > 0 && (
          <ul className="flex gap-2" aria-label={t("colors", { count: product.colors.length })}>
            {product.colors.map((c) => (
              <li key={c.id}>
                <span
                  title={pick(c.name, locale)}
                  className="block size-3 rounded-full border border-ink/20"
                  style={{ background: c.hex }}
                />
                <span className="sr-only">{pick(c.name, locale)}</span>
              </li>
            ))}
          </ul>
        )}
        {product.availability === "made_to_order" && (
          <p className="truncate text-[0.75rem] text-stone">{t("madeToOrderShort")}</p>
        )}
      </div>
    </article>
  );
}

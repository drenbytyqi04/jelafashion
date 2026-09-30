"use client";

import { Heart, Ruler, Video } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { CatalogProduct, Locale, MeasurementDefinition, Size } from "@/lib/catalog/types";
import { pick, SIZES } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { flyToCart } from "@/lib/fly-to-cart";
import { formatPrice } from "@/lib/format";
import { lineKey, useCartStore } from "@/stores/cart";
import { productItem, track } from "@/lib/tracking/track";
import { toast } from "@/stores/toast";
import { useWishlistStore } from "@/stores/wishlist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { MeasurementWizard, type WizardResult } from "@/components/wizard/measurement-wizard";
import { SizeGuideDrawer } from "./size-guide-drawer";

type Choice = Size | "custom" | null;

function productImageEl() {
  // The visible first frame: mobile swipe or desktop stack.
  const desktop = window.matchMedia("(min-width: 48rem)").matches;
  return document.querySelector(desktop ? "[data-product-image-desktop]" : "[data-product-image]");
}

export function PurchasePanel({
  product,
  measurements,
  whatsappHref,
}: {
  product: CatalogProduct;
  measurements: MeasurementDefinition[];
  /** Pre-filled WhatsApp link, or null when no number is configured. */
  whatsappHref: string | null;
}) {
  const t = useTranslations("product");
  const tw = useTranslations("wizard");
  const locale = useLocale() as Locale;
  const name = pick(product.name, locale);

  const [colorId, setColorId] = useState(product.colors[0]?.id);
  const [choice, setChoice] = useState<Choice>(null);
  const [error, setError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(true);
  const [pastCta, setPastCta] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);
  const sizesRef = useRef<HTMLFieldSetElement>(null);

  const addToCart = useCartStore((s) => s.add);
  const saved = useWishlistStore((s) => s.productIds.includes(product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];

  // One product view per page load (consent-gated inside track()).
  useEffect(() => {
    track({ name: "view_item", item: productItem(product, name) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  // The sticky mobile bar appears once the main button has scrolled out above the viewport.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setCtaVisible(entry.isIntersecting);
      setPastCta(entry.boundingClientRect.top < 0);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const stockFor = (size: Size) => product.sizes.find((s) => s.size === size)?.stock ?? 0;
  const offered = SIZES.filter((s) => product.sizes.some((x) => x.size === s));
  const unavailable = (size: Size) => product.availability === "in_stock" && stockFor(size) === 0;

  function baseLine() {
    return {
      productId: product.id,
      slug: product.slug,
      name,
      priceEUR: product.priceCents / 100,
      color: color ? pick(color.name, locale) : undefined,
      colorHex: color?.hex,
      image: product.images[0]?.url,
    };
  }

  function primaryAction() {
    if (!choice) {
      setError(t("chooseSizeFirst"));
      sizesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      sizesRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")?.focus({ preventScroll: true });
      return;
    }
    if (choice === "custom") {
      setWizardOpen(true);
      return;
    }
    addToCart({ ...baseLine(), key: lineKey(product.id, choice, color?.id), size: choice });
    track({ name: "add_to_cart", item: productItem(product, name, choice) });
    toast({ title: t("added"), description: t("addedText", { name, size: choice }), tone: "success" });
    flyToCart(productImageEl());
  }

  function onWizardComplete(result: WizardResult) {
    setWizardOpen(false);
    addToCart({
      ...baseLine(),
      key: lineKey(product.id, "custom", color?.id, result.measurements, result.notes),
      size: "custom",
      measurements: result.measurements,
      unit: result.unit,
      notes: result.notes || undefined,
    });
    track({ name: "add_to_cart", item: productItem(product, name, "custom") });
    toast({ title: tw("added"), description: tw("addedText", { name }), tone: "success" });
    // Let the wizard fade before the image flies.
    window.setTimeout(() => flyToCart(productImageEl()), 420);
  }

  const ctaLabel = choice === "custom" ? t("enterMeasurements") : t("addToCart");

  return (
    <div className="flex flex-col">
      <h1 className="font-serif text-h2 font-light">{name}</h1>
      <p className="nums mt-3 font-serif text-price">
        <span className="sr-only">{t("priceLabel")}: </span>
        {formatPrice(product.priceCents, locale)}
      </p>
      <div className="mt-4">
        {product.availability === "in_stock" ? (
          <Badge tone="success">{t("inStock")}</Badge>
        ) : (
          <Badge>{t("madeToOrder", { weeks: product.productionWeeks ?? 0 })}</Badge>
        )}
      </div>

      {/* Colour */}
      {product.colors.length > 0 && (
        <fieldset className="mt-8">
          <legend className="mb-3 text-small">
            {t("colorSelected", { color: color ? pick(color.name, locale) : "" })}
          </legend>
          <div className="flex gap-3">
            {product.colors.map((c) => (
              <label key={c.id} className="relative flex size-11 items-center justify-center" title={pick(c.name, locale)}>
                <input
                  type="radio"
                  name="color"
                  value={c.id}
                  checked={c.id === colorId}
                  onChange={() => setColorId(c.id)}
                  className="peer sr-only"
                />
                <span className="block size-6 rounded-full border border-ink/25" style={{ background: c.hex }} />
                <span aria-hidden className="absolute inset-[5px] rounded-full border border-ink opacity-0 peer-checked:opacity-100" />
                <span aria-hidden className="absolute inset-[3px] rounded-full peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-ink" />
                <span className="sr-only">{pick(c.name, locale)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Size */}
      <fieldset ref={sizesRef} className="mt-8" aria-describedby={error ? "size-error" : undefined}>
        <div className="mb-3 flex items-center justify-between">
          <legend className="text-small">{t("size")}</legend>
          <button type="button" onClick={() => setGuideOpen(true)} className="flex min-h-11 items-center text-small">
            <span className="link-underline">{t("sizeGuide")}</span>
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {offered.map((size) => {
            const disabled = unavailable(size);
            return (
              <label key={size} className={cn("relative", disabled && "cursor-not-allowed")}>
                <input
                  type="radio"
                  name="size"
                  value={size}
                  checked={choice === size}
                  disabled={disabled}
                  onChange={() => {
                    setChoice(size);
                    setError(null);
                  }}
                  className="peer sr-only"
                  aria-label={disabled ? t("outOfStock", { size }) : size}
                />
                <span
                  className={cn(
                    "label flex h-12 items-center justify-center border text-[0.75rem] tracking-[0.08em] transition-colors duration-(--duration-micro)",
                    "peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
                    disabled
                      ? "border-hairline text-stone line-through"
                      : "border-field hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory",
                  )}
                >
                  {size}
                </span>
              </label>
            );
          })}
        </div>
        <label className="relative mt-2 block">
          <input
            type="radio"
            name="size"
            value="custom"
            checked={choice === "custom"}
            onChange={() => {
              setChoice("custom");
              setError(null);
            }}
            className="peer sr-only"
          />
          <span
            className={cn(
              "flex min-h-12 items-center justify-center gap-3 border px-4 text-small transition-colors duration-(--duration-micro)",
              "border-field hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ivory",
              "peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
            )}
          >
            <Ruler aria-hidden size={18} strokeWidth={1.25} />
            {t("customSizeOption")}
          </span>
        </label>
        <p id="size-error" role="alert" className={cn("text-small text-error", error ? "mt-3" : "sr-only")}>
          {error}
        </p>
      </fieldset>

      {/* Actions */}
      <div ref={ctaRef} className="mt-8 grid grid-cols-[1fr_auto] gap-2">
        <Button magnetic onClick={primaryAction} className="w-full">
          {ctaLabel}
        </Button>
        <button
          type="button"
          onClick={() => {
            if (!saved) track({ name: "add_to_wishlist", item: productItem(product, name) });
            toggleWishlist(product.id);
          }}
          aria-pressed={saved}
          aria-label={saved ? t("inWishlist") : t("addToWishlist")}
          title={saved ? t("inWishlist") : t("addToWishlist")}
          className="flex size-[52px] items-center justify-center border border-field hover:border-ink"
        >
          <Heart aria-hidden size={20} strokeWidth={1.25} className={cn(saved && "fill-ink")} />
        </button>
      </div>

      <ul className="mt-6 flex flex-col">
        <li>
          {whatsappHref ? (
            <a href={whatsappHref} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-3 text-small">
              <WhatsAppIcon size={18} />
              <span className="link-quiet">{t("whatsapp")}</span>
            </a>
          ) : (
            <Link href="/contact" className="flex min-h-11 items-center gap-3 text-small">
              <WhatsAppIcon size={18} />
              <span className="link-quiet">{t("whatsapp")}</span>
            </Link>
          )}
        </li>
        <li>
          <Link
            href={{ pathname: "/contact", query: { topic: "video", dress: product.slug } }}
            className="flex min-h-11 items-center gap-3 text-small"
          >
            <Video aria-hidden size={18} strokeWidth={1.25} />
            <span className="link-quiet">{t("consultation")}</span>
          </Link>
        </li>
      </ul>

      {/* Sticky bar (mobile) once the main button is out of view */}
      <div
        aria-hidden={ctaVisible || !pastCta}
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-ivory pb-[env(safe-area-inset-bottom)] transition-transform duration-(--duration-ui) ease-(--ease-couture) md:hidden",
          !ctaVisible && pastCta ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="container-page flex h-16 items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-[1.125rem] leading-tight">{name}</p>
            <p className="nums text-small text-stone">{formatPrice(product.priceCents, locale)}</p>
          </div>
          <Button
            size="sm"
            tabIndex={!ctaVisible && pastCta ? 0 : -1}
            onClick={primaryAction}
            aria-label={choice === "custom" ? ctaLabel : t("stickyAdd", { name })}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>

      <SizeGuideDrawer open={guideOpen} onOpenChange={setGuideOpen} />
      <MeasurementWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        productName={name}
        definitions={measurements}
        onComplete={onWizardComplete}
      />
    </div>
  );
}

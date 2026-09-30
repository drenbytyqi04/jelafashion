"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { m, useMotionValue } from "motion/react";
import { Dialog } from "radix-ui";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type PointerEvent } from "react";
import type { CatalogProduct, Locale } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { duration, ease } from "@/lib/motion";
import { useLenisLock } from "@/components/motion/use-scroll-lock";
import { ProductMedia } from "./product-media";

const ZOOM = 2.2;

/**
 * Fullscreen ivory viewer. Tap or the zoom button toggles 2.2×; drag pans while zoomed;
 * swipe down (not zoomed) or Esc closes; arrows and the keyboard move between frames.
 */
export function ProductLightbox({
  product,
  count,
  index,
  onIndexChange,
}: {
  product: CatalogProduct;
  locale: Locale;
  count: number;
  index: number | null;
  onIndexChange: (i: number | null) => void;
}) {
  const t = useTranslations("product");
  const common = useTranslations("common");
  const locale = useLocale() as Locale;
  const open = index !== null;
  useLenisLock(open);
  const [zoomed, setZoomed] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const frame = useRef<HTMLDivElement>(null);

  function resetZoom() {
    setZoomed(false);
    x.set(0);
    y.set(0);
  }

  function go(delta: number) {
    if (index === null) return;
    resetZoom();
    onIndexChange((index + delta + count) % count);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    drag.current = { x: e.clientX, y: e.clientY, ox: x.get(), oy: y.get(), moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true;
    if (zoomed) {
      const el = frame.current;
      const maxX = el ? (el.clientWidth * (ZOOM - 1)) / 2 : 0;
      const maxY = el ? (el.clientHeight * (ZOOM - 1)) / 2 : 0;
      x.set(Math.max(-maxX, Math.min(maxX, d.ox + dx)));
      y.set(Math.max(-maxY, Math.min(maxY, d.oy + dy)));
    } else {
      y.set(Math.max(0, dy));
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!zoomed) {
      if (y.get() > 120) {
        y.set(0);
        onIndexChange(null);
        return;
      }
      y.set(0);
    }
    if (!d.moved) {
      if (zoomed) resetZoom();
      else setZoomed(true);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetZoom();
          onIndexChange(null);
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex flex-col bg-ivory focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
          }}
        >
          <Dialog.Title className="sr-only">{t("zoomDialog", { name: pick(product.name, locale) })}</Dialog.Title>
          <div className="flex h-14 items-center justify-between px-2">
            <p className="nums label px-3 text-stone">
              {(index ?? 0) + 1} / {count}
            </p>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => (zoomed ? resetZoom() : setZoomed(true))}
                aria-label={zoomed ? t("zoomOut") : t("zoomIn")}
                className="flex size-11 items-center justify-center"
              >
                {zoomed ? <ZoomOut aria-hidden size={20} strokeWidth={1.25} /> : <ZoomIn aria-hidden size={20} strokeWidth={1.25} />}
              </button>
              <Dialog.Close aria-label={common("close")} className="flex size-11 items-center justify-center">
                <X aria-hidden size={22} strokeWidth={1.25} />
              </Dialog.Close>
            </div>
          </div>
          <div
            ref={frame}
            className="relative flex-1 touch-none select-none overflow-hidden"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{ cursor: zoomed ? "grab" : "zoom-in" }}
          >
            {index !== null && (
              <m.div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: duration.ui, ease: ease.couture }}
              >
                <m.div
                  className="h-full max-h-full w-auto"
                  style={{ x, y, aspectRatio: "3 / 4" }}
                  animate={{ scale: zoomed ? ZOOM : 1 }}
                  transition={{ duration: duration.ui, ease: ease.couture }}
                >
                  <ProductMedia product={product} locale={locale} index={index} sizes="100vw" className="h-full" />
                </m.div>
              </m.div>
            )}
          </div>
          {count > 1 && (
            <div className="flex items-center justify-center gap-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
              <button type="button" onClick={() => go(-1)} aria-label={common("previous")} className="flex size-11 items-center justify-center border border-field">
                <ChevronLeft aria-hidden size={18} strokeWidth={1.25} />
              </button>
              <button type="button" onClick={() => go(1)} aria-label={common("next")} className="flex size-11 items-center justify-center border border-field">
                <ChevronRight aria-hidden size={18} strokeWidth={1.25} />
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

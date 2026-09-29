"use client";

import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";
import { primaryNav } from "@/lib/nav";
import { selectCartCount, useCartStore } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import { CartDrawer } from "./cart-drawer";

// Pages that open with a full-bleed image or video under a transparent header.
const OVERLAY_PATHS = new Set(["/"]);
const TOP_THRESHOLD = 24;
const HIDE_AFTER = 160;

export function SiteHeader() {
  const t = useTranslations();
  const pathname = usePathname();
  const overlayPage = OVERLAY_PATHS.has(pathname);
  const count = useCartStore(selectCartCount);
  const { menuOpen, setMenuOpen, setCartOpen } = useUiStore();

  const [atTop, setAtTop] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        setAtTop(y < TOP_THRESHOLD);
        // Small deltas are ignored so trackpad jitter doesn't flicker the header.
        if (Math.abs(y - lastY.current) > 6) {
          setHidden(y > lastY.current && y > HIDE_AFTER);
          lastY.current = y;
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const transparent = overlayPage && atTop && !menuOpen;
  const isHidden = hidden && !menuOpen && !focusWithin;

  // Sticky bars below the header (collection toolbar) follow it up and down.
  useEffect(() => {
    document.documentElement.style.setProperty("--header-offset", isHidden ? "0px" : "var(--header-h)");
  }, [isHidden]);

  const iconLink = "flex size-11 items-center justify-center";
  const icon = { size: 22, strokeWidth: 1.25, "aria-hidden": true } as const;

  return (
    <>
      <header
        onFocusCapture={() => setFocusWithin(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
        }}
        className={cn(
          "fixed inset-x-0 top-0 z-40 h-(--header-h)",
          "transition-[transform,background-color,color,border-color] duration-(--duration-ui) ease-(--ease-couture)",
          transparent
            ? "on-image border-b border-transparent bg-transparent text-white"
            : "border-b border-hairline bg-ivory text-ink",
          isHidden && "-translate-y-full",
        )}
      >
        {transparent && (
          // Keeps white icons legible over bright frames of the hero video.
          <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[160%] bg-gradient-to-b from-ink/35 to-transparent" />
        )}
        <div className="container-page grid h-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
          {/* Left */}
          <div className="flex items-center">
            <button
              type="button"
              className={cn(iconLink, "-ml-3 nav:hidden")}
              aria-label={t("common.openMenu")}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu {...icon} />
            </button>
            <nav aria-label={t("nav.primary")} className="hidden nav:block">
              <ul className="flex items-center gap-5">
                {primaryNav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <li key={item.key}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className="label group relative flex min-h-11 items-center whitespace-nowrap tracking-[0.16em]"
                      >
                        {t(`nav.${item.key}`)}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute inset-x-0 bottom-2 h-px origin-left bg-champagne transition-transform duration-(--duration-ui) ease-(--ease-couture)",
                            active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                          )}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Center */}
          <Link href="/" aria-label={t("common.home")} className="flex min-h-11 items-center">
            <span className="wordmark">Jela Fashion</span>
          </Link>

          {/* Right */}
          <div className="flex items-center justify-end">
            <div className="hidden items-center lg:flex">
              <Link href="/search" aria-label={t("common.search")} className={iconLink}>
                <Search {...icon} />
              </Link>
              <Link href="/account" aria-label={t("common.account")} className={iconLink}>
                <User {...icon} />
              </Link>
              <Link href="/wishlist" aria-label={t("common.wishlist")} className={iconLink}>
                <Heart {...icon} />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={t("common.cartWithCount", { count })}
              className={cn(iconLink, "relative -mr-3 lg:mr-0")}
            >
              <ShoppingBag {...icon} />
              {count > 0 && (
                <span
                  aria-hidden
                  className="nums absolute right-1 top-1 flex size-[18px] items-center justify-center rounded-full bg-champagne text-[10px] font-semibold text-ink"
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
            <LanguageSwitcher className="ml-3 hidden lg:flex" />
          </div>
        </div>
      </header>
      <MobileMenu />
      <CartDrawer />
    </>
  );
}

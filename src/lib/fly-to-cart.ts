import { ease } from "@/lib/motion";
import { useUiStore } from "@/stores/ui";

const DURATION = 750;
const EASE = `cubic-bezier(${ease.couture.join(", ")})`;
/** How far the arc lifts above the straight line, as a share of the distance (capped). */
const LIFT = 0.28;
const STEPS = 16;

/** Ask the header to come back if it is hidden (scrolled down): the flight needs a target. */
export const REVEAL_HEADER_EVENT = "jf:reveal-header";
/** Fired when the flying image reaches the bag, so the count settles on arrival. */
export const CART_LANDED_EVENT = "jf:cart-landed";

let flying = false;
/** True while an image is on its way to the bag. */
export const isFlying = () => flying;

/**
 * Sends a copy of `source` (the product image) along a soft arc to the header cart icon,
 * then opens the cart drawer. The drawer always opens, even if the animation is skipped
 * or interrupted. If the header is hidden, it is called back and the flight aims where
 * the icon is arriving.
 */
export function flyToCart(source: Element | null) {
  const open = () => useUiStore.getState().setCartOpen(true);
  const target = document.querySelector("[data-cart-target]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!source || !target || reduce) return open();

  const src = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (src.width === 0 || to.width === 0) return open();
  // Added from the sticky bar after scrolling: the photo is off-screen. The flight then
  // starts from a small 3:4 frame just above the bar, where the eye already is.
  const midY = src.top + src.height / 2;
  const onScreen = midY > 0 && midY < window.innerHeight;
  const from = onScreen
    ? src
    : new DOMRect(window.innerWidth / 2 - 42, window.innerHeight - 112 - 140, 84, 112);

  // A hidden header sits translated above the viewport; it slides back in while we fly.
  const header = target.closest("header");
  let toTop = to.top;
  if (header && to.bottom <= 0) {
    window.dispatchEvent(new Event(REVEAL_HEADER_EVENT));
    toTop += header.getBoundingClientRect().height;
  }

  flying = true;
  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    zIndex: "60",
    pointerEvents: "none",
    transformOrigin: "top left",
    overflow: "hidden",
    willChange: "transform, opacity",
  });
  ghost.setAttribute("aria-hidden", "true");
  document.body.appendChild(ghost);

  const scale = Math.max(to.width / from.width, 0.04);
  const dx = to.left + to.width / 2 - (from.left + (from.width * scale) / 2);
  const dy = toTop + to.height / 2 - (from.top + (from.height * scale) / 2);
  // Quadratic curve: the control point sits above the midpoint, so the image lifts, then
  // drops into the bag, rather than sliding in a straight line.
  const lift = Math.min(Math.hypot(dx, dy) * LIFT, 160);
  const cx = dx / 2;
  const cy = Math.min(0, dy) / 2 - lift;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const x = 2 * (1 - t) * t * cx + t * t * dx;
    const y = 2 * (1 - t) * t * cy + t * t * dy;
    const k = 1 + (scale - 1) * t;
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${k})`, opacity: 1 - 0.65 * t * t });
  }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    flying = false;
    ghost.remove();
    window.dispatchEvent(new Event(CART_LANDED_EVENT));
    open();
  };
  const anim = ghost.animate(frames, { duration: DURATION, easing: EASE, fill: "forwards" });
  anim.onfinish = finish;
  anim.oncancel = finish;
  window.setTimeout(finish, DURATION + 150);
}

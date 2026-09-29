import { useUiStore } from "@/stores/ui";

const DURATION = 600;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/**
 * Sends a copy of `source` (the product image) to the header cart icon, then opens the
 * cart drawer. The drawer always opens, even if the animation is skipped or interrupted.
 */
export function flyToCart(source: Element | null) {
  const open = () => useUiStore.getState().setCartOpen(true);
  const target = document.querySelector("[data-cart-target]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!source || !target || reduce) return open();

  const from = source.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  if (from.width === 0 || to.width === 0) return open();

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
  });
  ghost.setAttribute("aria-hidden", "true");
  document.body.appendChild(ghost);

  const scale = Math.max(to.width / from.width, 0.04);
  const dx = to.left + to.width / 2 - (from.left + (from.width * scale) / 2);
  const dy = to.top + to.height / 2 - (from.top + (from.height * scale) / 2);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    ghost.remove();
    open();
  };
  const anim = ghost.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.2 },
    ],
    { duration: DURATION, easing: EASE, fill: "forwards" },
  );
  anim.onfinish = finish;
  anim.oncancel = finish;
  window.setTimeout(finish, DURATION + 150);
}

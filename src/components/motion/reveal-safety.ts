// Reveals render their hidden starting state on the server. If the bundle is slow (an
// Instagram in-app browser on a weak connection), this head script shows everything after
// a few seconds; MotionProvider marks hydration so the fallback never fires on a normal load.
export const REVEAL_FALLBACK_MS = 3000;

export const revealFallbackScript = `setTimeout(function(){if(!window.__jfHydrated)document.documentElement.setAttribute("data-reveal-fallback","")},${REVEAL_FALLBACK_MS});`;

/** Without JS at all, reveals show their final state. */
export const revealNoScriptCss = "[data-reveal]{clip-path:none!important;transform:none!important;opacity:1!important}";

declare global {
  interface Window {
    __jfHydrated?: boolean;
  }
}

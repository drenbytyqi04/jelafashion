"use client";

import { useLenis } from "lenis/react";
import { useEffect } from "react";

/** Radix locks body scroll for dialogs, but Lenis drives scrolling itself and must be paused too. */
export function useLenisLock(locked: boolean) {
  const lenis = useLenis();
  useEffect(() => {
    if (!lenis || !locked) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis, locked]);
}

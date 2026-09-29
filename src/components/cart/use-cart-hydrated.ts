"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "@/stores/cart";

/** False on the server and during hydration, true once the saved cart has loaded. */
export function useCartHydrated() {
  return useSyncExternalStore(
    (cb) => useCartStore.persist.onFinishHydration(cb),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}

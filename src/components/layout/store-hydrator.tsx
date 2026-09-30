"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart";
import { useConsentStore } from "@/stores/consent";
import { useRecentlyViewed } from "@/stores/recently-viewed";
import { useSavedMeasurements } from "@/stores/saved-measurements";
import { useWishlistStore } from "@/stores/wishlist";

/** Loads persisted cart and wishlist after mount to avoid hydration mismatches. */
export function StoreHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
    void useRecentlyViewed.persist.rehydrate();
    void useSavedMeasurements.persist.rehydrate();
    void useConsentStore.persist.rehydrate();
  }, []);
  return null;
}

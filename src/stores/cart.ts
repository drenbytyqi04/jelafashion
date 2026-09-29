import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Phase 1 keeps the shape minimal for the header count and drawer. Phase 3 adds
// measurements, pricing rules and server sync.

export type CartLine = {
  /** productId + size + color (+ measurement hash for custom sizes). */
  key: string;
  productId: string;
  name: string;
  priceEUR: number;
  quantity: number;
  size: string;
  color?: string;
  image?: string;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.key === line.key);
          if (existing) {
            return {
              lines: s.lines.map((l) => (l.key === line.key ? { ...l, quantity: l.quantity + quantity } : l)),
            };
          }
          return { lines: [...s.lines, { ...line, quantity }] };
        }),
      setQuantity: (key, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "jf-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated in <StoreHydrator/> after mount so server and first client render match.
      skipHydration: true,
    },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);

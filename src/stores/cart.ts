import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Unit } from "@/lib/units";

/** Labels travel with the values so cart, checkout, emails and admin can show them as entered. */
export type CartMeasurement = { id: string; cm: number; label?: { sq: string; en: string } };

export type CartLine = {
  /** productId + size + colour, plus a measurement fingerprint for custom sizes. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  priceEUR: number;
  quantity: number;
  /** Standard size, or "custom" when made to the customer's measurements. */
  size: string;
  color?: string;
  colorHex?: string;
  image?: string;
  /** Custom size only: every measurement in centimetres, in wizard order. */
  measurements?: CartMeasurement[];
  /** Unit the customer entered them in, for display back to her. */
  unit?: Unit;
  notes?: string;
};

type CartState = {
  lines: CartLine[];
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  /** Server corrections at checkout (new price, less stock). */
  patch: (key: string, changes: Partial<Pick<CartLine, "priceEUR" | "quantity">>) => void;
  clear: () => void;
};

export const MAX_QUANTITY = 10;

/** Stable key so identical custom measurements merge and different ones never do. */
export function lineKey(productId: string, size: string, colorId?: string, measurements?: CartMeasurement[], notes?: string) {
  const base = `${productId}-${size}-${colorId ?? "default"}`;
  if (!measurements) return base;
  const payload = measurements.map((m) => `${m.id}:${m.cm.toFixed(1)}`).join("|") + `#${notes ?? ""}`;
  let h = 0;
  for (let i = 0; i < payload.length; i++) h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  return `${base}-${(h >>> 0).toString(36)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.key === line.key);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.key === line.key ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + quantity) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }] };
        }),
      setQuantity: (key, quantity) =>
        set((s) => ({
          lines:
            quantity <= 0
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QUANTITY, quantity) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      patch: (key, changes) => set((s) => ({ lines: s.lines.map((l) => (l.key === key ? { ...l, ...changes } : l)) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "jf-cart",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // v1 lines lack `slug`; drop them rather than show broken links.
      migrate: (state, version) => (version < 2 ? { lines: [] } : state) as CartState,
      // Rehydrated in <StoreHydrator/> after mount so server and first client render match.
      skipHydration: true,
    },
  ),
);

export const selectCartCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectCartSubtotal = (s: CartState) => s.lines.reduce((n, l) => n + l.priceEUR * l.quantity, 0);


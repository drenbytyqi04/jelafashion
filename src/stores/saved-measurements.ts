import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Unit } from "@/lib/units";

/**
 * "Remember on this device" for guests. Values in cm, keyed by measurement id, so one
 * saved set pre-fills any dress. Signed-in customers get named profiles in Phase 5.
 */
type SavedState = {
  values: Record<string, number>;
  unit: Unit;
  savedAt: string | null;
  save: (values: Record<string, number>, unit: Unit) => void;
  forget: () => void;
};

export const useSavedMeasurements = create<SavedState>()(
  persist(
    (set) => ({
      values: {},
      unit: "cm",
      savedAt: null,
      save: (values, unit) => set((s) => ({ values: { ...s.values, ...values }, unit, savedAt: new Date().toISOString() })),
      forget: () => set({ values: {}, savedAt: null }),
    }),
    { name: "jf-measurements", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

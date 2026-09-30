import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ConsentChoices = { analytics: boolean; marketing: boolean };

type ConsentState = ConsentChoices & {
  /** When the visitor chose; null until then (the banner shows). */
  decidedAt: string | null;
  preferencesOpen: boolean;
  save: (choices: ConsentChoices) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
};

/**
 * Cookie consent (necessary / analytics / marketing). Nothing optional loads until the
 * visitor chooses; the choice can be changed any time from the footer or cookie page.
 * Bump the version when the categories change, so everyone is asked again.
 */
export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      analytics: false,
      marketing: false,
      decidedAt: null,
      preferencesOpen: false,
      save: (choices) => set({ ...choices, decidedAt: new Date().toISOString(), preferencesOpen: false }),
      acceptAll: () => set({ analytics: true, marketing: true, decidedAt: new Date().toISOString(), preferencesOpen: false }),
      rejectAll: () => set({ analytics: false, marketing: false, decidedAt: new Date().toISOString(), preferencesOpen: false }),
      openPreferences: () => set({ preferencesOpen: true }),
      closePreferences: () => set({ preferencesOpen: false }),
    }),
    {
      name: "jf-consent",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ analytics: s.analytics, marketing: s.marketing, decidedAt: s.decidedAt }),
      skipHydration: true,
    },
  ),
);

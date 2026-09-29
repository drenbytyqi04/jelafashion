import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX = 9;

type RecentState = { slugs: string[]; push: (slug: string) => void };

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set) => ({
      slugs: [],
      push: (slug) => set((s) => ({ slugs: [slug, ...s.slugs.filter((x) => x !== slug)].slice(0, MAX) })),
    }),
    { name: "jf-recent", version: 1, storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

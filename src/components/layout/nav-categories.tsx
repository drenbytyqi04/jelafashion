"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CategoryId } from "@/lib/catalog/types";

/**
 * Categories with no published dress. The layout works them out from the catalogue so
 * every menu can leave them out instead of linking to an empty page; they return on their
 * own once a dress in that category is published.
 */
const EmptyCategories = createContext<readonly CategoryId[]>([]);

export function NavCategoriesProvider({ empty, children }: { empty: readonly CategoryId[]; children: ReactNode }) {
  return <EmptyCategories.Provider value={empty}>{children}</EmptyCategories.Provider>;
}

/** Filters a nav list down to the categories that have dresses (other keys pass). */
export function useVisibleNav<T extends { key: string }>(items: readonly T[]): T[] {
  const empty = useContext(EmptyCategories) as readonly string[];
  return items.filter((i) => !empty.includes(i.key));
}

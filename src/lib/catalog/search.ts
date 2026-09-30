import type { CatalogProduct, Locale } from "./types";

// Small catalog, so search runs in the browser over both languages plus the filter labels
// (category, colour family, length, sleeves), accent-insensitive: "nuserie" finds "nusërie".

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export type SearchLabels = { category: Record<string, string>; color: Record<string, string>; length: Record<string, string>; sleeves: Record<string, string> };

export function searchText(p: CatalogProduct, labels: Record<Locale, SearchLabels>) {
  const parts = [p.name.sq, p.name.en, p.description.sq, p.description.en, p.silhouette ?? ""];
  for (const l of Object.values(labels)) {
    parts.push(l.category[p.category] ?? "", l.length[p.length] ?? "", l.sleeves[p.sleeves] ?? "");
    for (const c of p.colors) parts.push(l.color[c.family] ?? "");
  }
  for (const c of p.colors) parts.push(c.name.sq, c.name.en);
  return normalize(parts.join(" "));
}

/** Every word must match somewhere; name matches rank first. */
export function searchProducts(products: { product: CatalogProduct; text: string }[], query: string) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return products
    .filter((p) => words.every((w) => p.text.includes(w)))
    .sort((a, b) => Number(words.some((w) => normalize(b.product.name.sq).includes(w))) - Number(words.some((w) => normalize(a.product.name.sq).includes(w))))
    .map((p) => p.product);
}

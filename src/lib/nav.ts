import type { StaticPathname } from "@/i18n/routing";

type NavKey = "shop" | "bridal" | "evening" | "short" | "madeToMeasure" | "newIn" | "atelier" | "contact";

export const primaryNav: { key: NavKey; href: StaticPathname }[] = [
  { key: "shop", href: "/shop" },
  { key: "bridal", href: "/bridal" },
  { key: "evening", href: "/evening" },
  { key: "short", href: "/short" },
  { key: "madeToMeasure", href: "/made-to-measure" },
];

export const categoryNav: { key: "bridal" | "evening" | "short"; href: StaticPathname; tone: "linen" | "blush" | "stone" }[] = [
  { key: "bridal", href: "/bridal", tone: "linen" },
  { key: "evening", href: "/evening", tone: "stone" },
  { key: "short", href: "/short", tone: "blush" },
];

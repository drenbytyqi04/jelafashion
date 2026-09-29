import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sq", "en"],
  defaultLocale: "sq",
  localePrefix: "always",
  // Albanian slugs carry the target keywords (fustane nusërie, fustane sipas masave, ...).
  pathnames: {
    "/": "/",
    "/shop": { sq: "/dyqani", en: "/shop" },
    "/new-in": { sq: "/te-rejat", en: "/new-in" },
    "/bridal": { sq: "/fustane-nuserie", en: "/bridal-dresses" },
    "/evening": { sq: "/fustane-mbremjeje", en: "/evening-dresses" },
    "/short": { sq: "/fustane-te-shkurtra", en: "/short-dresses" },
    "/made-to-measure": { sq: "/fustane-sipas-masave", en: "/made-to-measure" },
    "/size-guide": { sq: "/udhezuesi-i-masave", en: "/size-guide" },
    "/shipping": { sq: "/dergesa", en: "/shipping" },
    "/returns": { sq: "/kthimet", en: "/returns" },
    "/faq": { sq: "/pyetje-te-shpeshta", en: "/faq" },
    "/contact": { sq: "/kontakti", en: "/contact" },
    "/atelier": { sq: "/atelja", en: "/atelier" },
    "/privacy": { sq: "/privatesia", en: "/privacy" },
    "/terms": { sq: "/kushtet", en: "/terms" },
    "/cookies": { sq: "/cookies", en: "/cookies" },
    "/search": { sq: "/kerko", en: "/search" },
    "/account": { sq: "/llogaria", en: "/account" },
    "/wishlist": { sq: "/te-preferuarat", en: "/wishlist" },
    "/cart": { sq: "/shporta", en: "/cart" },
    "/styleguide": "/styleguide",
  },
});

export type Locale = (typeof routing.locales)[number];
export type AppPathname = keyof typeof routing.pathnames;

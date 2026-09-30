import { Cormorant_Garamond, Manrope } from "next/font/google";

// Shared by the shop's and the admin panel's root layouts.

// 300 headlines, 400 titles, 500 the wordmark. Preloaded: they paint above the fold.
export const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  variable: "--font-cormorant",
  display: "swap",
});

// Italic appears only in the testimonial quotes, far below the fold: loaded, not preloaded.
export const cormorantItalic = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: "300",
  style: "italic",
  variable: "--font-cormorant-italic",
  display: "swap",
  preload: false,
});

// Manrope is variable: one file covers 400–600.
export const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

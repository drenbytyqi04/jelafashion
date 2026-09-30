import { Cormorant_Garamond, Manrope } from "next/font/google";

// Shared by the shop's and the admin panel's root layouts.

export const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

// Manrope is variable: one file covers 400–600.
export const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

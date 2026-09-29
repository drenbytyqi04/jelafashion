import type { Size } from "./types";

/**
 * Standard body measurements (cm) behind the XS–XXL sizes.
 * CONFIRM WITH THE ATELIER before launch: these follow common EU womenswear sizing and
 * must be replaced with Jela Fashion's own pattern block if it differs.
 */
export const SIZE_CHART: { size: Size; eu: string; bust: number; waist: number; hips: number }[] = [
  { size: "XS", eu: "34", bust: 80, waist: 62, hips: 88 },
  { size: "S", eu: "36", bust: 84, waist: 66, hips: 92 },
  { size: "M", eu: "38", bust: 88, waist: 70, hips: 96 },
  { size: "L", eu: "40", bust: 92, waist: 74, hips: 100 },
  { size: "XL", eu: "42", bust: 98, waist: 80, hips: 106 },
  { size: "XXL", eu: "44", bust: 104, waist: 86, hips: 112 },
];

export type Unit = "cm" | "in";

export const CM_PER_INCH = 2.54;

export const toUnit = (cm: number, unit: Unit) => (unit === "cm" ? cm : cm / CM_PER_INCH);
export const toCm = (value: number, unit: Unit) => (unit === "cm" ? value : value * CM_PER_INCH);

/** One decimal at most, locale decimal separator ("86,5" in Albanian). */
export function formatMeasure(value: number, locale: "sq" | "en") {
  const rounded = Math.round(value * 10) / 10;
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return locale === "sq" ? s.replace(".", ",") : s;
}

/** Parses "86", "86.5" or "86,5"; returns null for anything else. */
export function parseMeasure(raw: string): number | null {
  const s = raw.trim().replace(",", ".");
  if (!/^\d{1,3}(\.\d)?$/.test(s)) return null;
  return Number(s);
}

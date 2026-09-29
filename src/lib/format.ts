import type { Locale } from "@/lib/catalog/types";

/**
 * "1.450 €" in Albanian, "€1,450" in English; decimals only when needed.
 * Formatted by hand: server (Node ICU) and browsers ship different Albanian locale data,
 * and Intl output that differs between them breaks hydration.
 */
export function formatPrice(cents: number, locale: Locale) {
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const group = locale === "sq" ? "." : ",";
  const decimal = locale === "sq" ? "," : ".";
  const int = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const amount = fraction ? `${int}${decimal}${String(fraction).padStart(2, "0")}` : int;
  const sign = negative ? "-" : "";
  return locale === "sq" ? `${sign}${amount} €` : `${sign}€${amount}`;
}

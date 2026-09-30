import type { Locale } from "@/lib/catalog/types";
import { formatPrice } from "@/lib/format";
import type { Address, Order, PaymentMethodConfig } from "./types";

// Presentation helpers shared by the confirmation page and emails (server side only, so
// Intl output never has to match a browser's).

const displayNames = new Map<Locale, Intl.DisplayNames>();

export function countryName(code: string, locale: Locale) {
  let dn = displayNames.get(locale);
  if (!dn) displayNames.set(locale, (dn = new Intl.DisplayNames([locale], { type: "region" })));
  try {
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

export function addressLines(a: Address, locale: Locale) {
  return [
    `${a.firstName} ${a.lastName}`,
    a.line1,
    a.line2,
    [a.postalCode, a.city].filter(Boolean).join(" "),
    a.region,
    countryName(a.country, locale),
  ].filter((l): l is string => Boolean(l));
}

export type DetailKey =
  | "bankName" | "beneficiary" | "iban" | "swift" | "reference" | "amount"
  | "recipient" | "city" | "country" | "agencies" | "wiseEmail" | "accountHolder";

/** Rows for the "how to pay" block; labels are keys in the `payment` namespace. */
export function paymentDetailRows(order: Order, method: PaymentMethodConfig | undefined, locale: Locale) {
  const rows: { key: DetailKey; value: string; copy?: boolean }[] = [];
  const add = (key: DetailKey, value: string | undefined, copy = true) => {
    if (value) rows.push({ key, value, copy });
  };
  const amount = formatPrice(order.totalCents, locale);
  if (method?.id === "bank_transfer") {
    add("beneficiary", method.details.beneficiary);
    add("iban", method.details.iban);
    add("swift", method.details.swift);
    add("bankName", method.details.bankName, false);
  } else if (method?.id === "cash_agency") {
    add("recipient", method.details.recipient);
    add("city", method.details.city, false);
    add("country", method.details.country, false);
    add("agencies", method.details.agencies?.join(", "), false);
  } else if (method?.id === "wise") {
    add("accountHolder", method.details.accountHolder);
    add("wiseEmail", method.details.email);
  }
  add("amount", amount, false);
  add("reference", order.number);
  return rows;
}

import "server-only";
import { getCountries, getCountryCallingCode } from "libphonenumber-js/min";
import type { Locale } from "@/lib/catalog/types";
import { countryName } from "./present";

/** Every country we can ship to, named in the visitor's language, sorted for that language. */
export function countryOptions(locale: Locale) {
  const collator = new Intl.Collator(locale);
  return getCountries()
    .map((code) => ({ code, name: countryName(code, locale), callingCode: getCountryCallingCode(code) }))
    .filter((c) => c.name !== c.code)
    .sort((a, b) => collator.compare(a.name, b.name));
}

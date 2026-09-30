"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { CheckoutHeader } from "./checkout-chrome";
import { SiteHeader } from "./site-header";

/** Routes that drop the shop navigation and footer (see pages/checkout.md). */
const FOCUS_PATHS = new Set<string>(["/checkout"]);

function useFocusMode() {
  return FOCUS_PATHS.has(usePathname());
}

export function HeaderSwitch() {
  return useFocusMode() ? <CheckoutHeader /> : <SiteHeader />;
}

/** The full footer is a server component, so both variants arrive as rendered props. */
export function FooterSwitch({ site, focus }: { site: ReactNode; focus: ReactNode }) {
  return useFocusMode() ? focus : site;
}

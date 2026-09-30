import "server-only";
import type { Order, PaymentMethodId } from "@/lib/commerce/types";
import { OFFLINE_METHODS } from "@/lib/commerce/types";
import { payseraConfigured, payseraRedirectUrl, payseraSandbox } from "./paysera";

export type PaymentStart =
  /** Send the customer to the provider; the order is paid once its callback verifies. */
  | { kind: "redirect"; url: string }
  /** Offline method: show instructions and accept a proof of payment. */
  | { kind: "offline" };

export type PaymentProvider = {
  id: PaymentMethodId;
  start(order: Order, siteUrl: string, confirmationPath: string): PaymentStart;
};

const paysera: PaymentProvider = {
  id: "paysera",
  start(order, siteUrl, confirmationPath) {
    const accept = `${siteUrl}${confirmationPath}`;
    const cancel = `${siteUrl}${confirmationPath}?payment=cancelled`;
    if (!payseraConfigured()) {
      // Local sandbox (never in production): a page that simulates Paysera's outcome.
      if (!payseraSandbox()) throw new Error("Paysera is not configured");
      const q = new URLSearchParams({ order: order.id, token: order.accessToken });
      return { kind: "redirect", url: `${siteUrl}/api/payments/paysera/sandbox?${q}` };
    }
    return {
      kind: "redirect",
      url: payseraRedirectUrl(order, { accept, cancel, callback: `${siteUrl}/api/payments/paysera/callback` }),
    };
  },
};

const offline = (id: PaymentMethodId): PaymentProvider => ({ id, start: () => ({ kind: "offline" }) });

const providers: Record<PaymentMethodId, PaymentProvider> = {
  paysera,
  bank_transfer: offline("bank_transfer"),
  cash_agency: offline("cash_agency"),
  wise: offline("wise"),
};

export const paymentProvider = (id: PaymentMethodId) => providers[id];
export const isOffline = (id: PaymentMethodId) => OFFLINE_METHODS.includes(id);

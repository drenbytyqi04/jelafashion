import "server-only";
import { createHash, createVerify, timingSafeEqual } from "node:crypto";
import type { Order } from "@/lib/commerce/types";

// Paysera "Checkout" (payment initiation) protocol v1.6:
//   request:  data = base64url(query string), sign = md5(data + sign password)
//   callback: data (same encoding), ss1 = md5(data + password), ss2 = RSA-SHA1 over data
// https://developers.paysera.com/en/checkout/integrations/integration-specification

const PAY_URL = "https://www.paysera.com/pay/";

export function payseraConfigured() {
  return Boolean(process.env.PAYSERA_PROJECT_ID && process.env.PAYSERA_SIGN_PASSWORD);
}

/**
 * Local stand-in for Paysera (see /api/payments/paysera/sandbox): only while Paysera is not
 * configured, and never in a real production deployment (JF_LOCAL_ORDERS=1 is for local QA).
 */
export function payseraSandbox() {
  return !payseraConfigured() && (process.env.NODE_ENV !== "production" || process.env.JF_LOCAL_ORDERS === "1");
}

export const payseraTestMode = () => process.env.PAYSERA_TEST_MODE === "true";

function encode(params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  return Buffer.from(query).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}

function decode(data: string): URLSearchParams {
  const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return new URLSearchParams(Buffer.from(b64, "base64").toString("utf8"));
}

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Paysera has no Albanian interface, so both site languages open it in English. */
const PAYSERA_LANG = "ENG";

export function payseraRedirectUrl(order: Order, urls: { accept: string; cancel: string; callback: string }) {
  const projectId = process.env.PAYSERA_PROJECT_ID;
  const password = process.env.PAYSERA_SIGN_PASSWORD;
  if (!projectId || !password) throw new Error("Paysera is not configured");
  const billing = order.billingAddress ?? order.shippingAddress;
  const data = encode({
    projectid: projectId,
    orderid: order.id,
    accepturl: urls.accept,
    cancelurl: urls.cancel,
    callbackurl: urls.callback,
    version: "1.6",
    amount: String(order.totalCents),
    currency: "EUR",
    country: billing.country,
    lang: PAYSERA_LANG,
    paytext: `Jela Fashion ${order.number} ([order_nr]) ([site_name])`,
    p_email: order.email,
    p_firstname: billing.firstName,
    p_lastname: billing.lastName,
    ...(payseraTestMode() ? { test: "1" } : {}),
  });
  return `${PAY_URL}?data=${data}&sign=${md5(data + password)}`;
}

export type PayseraCallback =
  | { ok: true; orderId: string; paid: boolean; amountCents: number; currency: string; test: boolean; requestId: string | null; params: Record<string, string> }
  | { ok: false; reason: string; params?: Record<string, string> };

/**
 * Verifies a callback. ss1 (keyed with the secret sign password) is always required; ss2 is
 * checked too when PAYSERA_PUBLIC_KEY holds Paysera's public key (PEM).
 */
export function verifyPayseraCallback(input: { data?: string | null; ss1?: string | null; ss2?: string | null }): PayseraCallback {
  const projectId = process.env.PAYSERA_PROJECT_ID;
  const password = process.env.PAYSERA_SIGN_PASSWORD;
  if (!projectId || !password) return { ok: false, reason: "not configured" };
  const { data, ss1, ss2 } = input;
  if (!data || !ss1) return { ok: false, reason: "missing data or ss1" };
  if (!safeEqual(md5(data + password), ss1.toLowerCase())) return { ok: false, reason: "bad ss1" };

  const publicKey = process.env.PAYSERA_PUBLIC_KEY?.replace(/\\n/g, "\n");
  if (publicKey) {
    if (!ss2) return { ok: false, reason: "missing ss2" };
    const verifier = createVerify("RSA-SHA1");
    verifier.update(data);
    const sig = Buffer.from(ss2.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (!verifier.verify(publicKey, sig)) return { ok: false, reason: "bad ss2" };
  }

  const params = Object.fromEntries(decode(data));
  if (params.projectid !== projectId) return { ok: false, reason: "project mismatch", params };
  const test = params.test === "1";
  if (test && !payseraTestMode()) return { ok: false, reason: "test payment outside test mode", params };
  // type=macro is the payment notification; other types (e.g. SMS) are not ours.
  if (params.type && params.type !== "macro") return { ok: false, reason: `unsupported type ${params.type}`, params };
  return {
    ok: true,
    orderId: params.orderid ?? "",
    // status 1 = paid; 0 = not paid, 2 = accepted but not executed yet, 3 = extra info.
    paid: params.status === "1",
    amountCents: Number(params.amount),
    currency: params.currency ?? "",
    test,
    requestId: params.requestid ?? null,
    params,
  };
}

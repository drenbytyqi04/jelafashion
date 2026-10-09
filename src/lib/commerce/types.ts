import type { Bilingual, Locale } from "@/lib/catalog/types";
import type { Unit } from "@/lib/units";

export const PAYMENT_METHOD_IDS = ["paysera", "bank_transfer", "cash_agency", "wise"] as const;
export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

/** Card payments settle online; the rest wait for the atelier to confirm the money arrived. */
export const OFFLINE_METHODS: PaymentMethodId[] = ["bank_transfer", "cash_agency", "wise"];

export const ORDER_STATUSES = ["awaiting_payment", "paid", "in_production", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ShippingRate = {
  id: string;
  name: Bilingual;
  priceCents: number;
  freeOverCents: number | null;
  minDays: number;
  maxDays: number;
};

export type ShippingZone = {
  id: string;
  name: Bilingual;
  /** ISO 3166-1 alpha-2 (XK for Kosovo). */
  countries: string[];
  isFallback: boolean;
  rates: ShippingRate[];
};

export type BankDetails = { bankName?: string; beneficiary?: string; iban?: string; swift?: string };
export type CashAgencyDetails = { recipient?: string; city?: string; country?: string; agencies?: string[] };
export type WiseDetails = { email?: string; accountHolder?: string };

export type PaymentMethodConfig =
  | { id: "paysera"; details: Record<string, never> }
  | { id: "bank_transfer"; details: BankDetails }
  | { id: "cash_agency"; details: CashAgencyDetails }
  | { id: "wise"; details: WiseDetails };

export type Discount = {
  code: string;
  kind: "percent" | "fixed";
  /** percent: 1–100; fixed: cents */
  value: number;
  minSubtotalCents: number;
};

export type Address = {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  region?: string;
  /** ISO 3166-1 alpha-2 */
  country: string;
};

export type OrderMeasurement = { id: string; cm: number; label?: Bilingual };

export type OrderItem = {
  productId: string | null;
  productSlug: string;
  name: string;
  color: string | null;
  size: string;
  quantity: number;
  unitPriceCents: number;
  measurements: OrderMeasurement[] | null;
  measurementUnit: Unit | null;
  notes: string | null;
};

export type PaymentProof = {
  /** Storage path; server only (proofs are private). */
  path: string;
  fileName: string;
  contentType: string;
  reference: string | null;
  senderName: string | null;
  createdAt: string;
};

export type OrderEvent = { status: string; note: string | null; createdAt: string };

export type Order = {
  id: string;
  number: string;
  accessToken: string;
  /** Account that placed it; guest orders are matched by email instead. */
  userId: string | null;
  email: string;
  phone: string;
  locale: Locale;
  marketingOptIn: boolean;
  status: OrderStatus;
  paymentMethod: PaymentMethodId;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  discountCode: string | null;
  shippingRateId: string | null;
  shippingMethod: { name: Bilingual; minDays: number; maxDays: number };
  shippingAddress: Address;
  billingAddress: Address | null;
  customerNote: string | null;
  paidAt: string | null;
  paymentReference: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  createdAt: string;
  /** When an admin first opened the order; null while it is new. */
  seenAt: string | null;
  items: OrderItem[];
  proofs: PaymentProof[];
};

export type NewOrder = Omit<
  Order,
  "id" | "number" | "accessToken" | "status" | "paidAt" | "paymentReference" | "trackingNumber" | "trackingCarrier" | "createdAt" | "seenAt" | "proofs"
>;

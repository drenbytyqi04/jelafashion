import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as seed from "@/lib/catalog/seed-data";
import { publicSupabase } from "@/lib/supabase/public-client";
import { serviceSupabase } from "@/lib/supabase/service-client";
import type { Discount, NewOrder, Order, OrderStatus, PaymentProof } from "./types";

export type ProofFile = { bytes: Uint8Array; contentType: string; fileName: string; extension: string };

/**
 * Where orders live. Supabase in production (service role, server only); a JSON file under
 * .data/ for local development without Supabase credentials. Callers never touch either
 * directly, so the checkout, callbacks and (Phase 5) admin share one set of rules.
 */
export interface OrderStore {
  findDiscount(code: string): Promise<Discount | null>;
  /** Atomically counts one use; false when the code is no longer valid. */
  redeemDiscount(code: string): Promise<boolean>;
  create(order: NewOrder): Promise<Order>;
  getById(id: string): Promise<Order | null>;
  getByToken(token: string): Promise<Order | null>;
  /** Moves an order from awaiting_payment to paid; returns null if it was not awaiting payment. */
  markPaid(id: string, reference: string | null, note: string): Promise<Order | null>;
  addProof(orderId: string, file: ProofFile, reference: string | null, senderName: string | null): Promise<PaymentProof>;
  recordCallback(orderId: string | null, provider: string, payload: unknown, verified: boolean): Promise<void>;
}

// ---------------------------------------------------------------------------------------
// Supabase

type OrderRow = {
  id: string;
  number: string;
  access_token: string;
  email: string;
  phone: string;
  locale: Order["locale"];
  marketing_opt_in: boolean;
  status: OrderStatus;
  payment_method: Order["paymentMethod"];
  subtotal_cents: number;
  discount_cents: number;
  shipping_cents: number;
  total_cents: number;
  discount_code: string | null;
  shipping_rate_id: string | null;
  shipping_method: Order["shippingMethod"];
  shipping_address: Order["shippingAddress"];
  billing_address: Order["billingAddress"];
  customer_note: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  tracking_number: string | null;
  tracking_carrier: string | null;
  created_at: string;
  order_items?: {
    product_id: string | null;
    product_slug: string;
    name: string;
    color: string | null;
    size: string;
    quantity: number;
    unit_price_cents: number;
    measurements: Order["items"][number]["measurements"];
    measurement_unit: Order["items"][number]["measurementUnit"];
    notes: string | null;
  }[];
  payment_proofs?: { file_name: string; reference: string | null; sender_name: string | null; created_at: string }[];
};

const ORDER_SELECT = `*, order_items (product_id, product_slug, name, color, size, quantity, unit_price_cents, measurements, measurement_unit, notes),
  payment_proofs (file_name, reference, sender_name, created_at)`;

function fromRow(r: OrderRow): Order {
  return {
    id: r.id,
    number: r.number,
    accessToken: r.access_token,
    email: r.email,
    phone: r.phone,
    locale: r.locale,
    marketingOptIn: r.marketing_opt_in,
    status: r.status,
    paymentMethod: r.payment_method,
    subtotalCents: r.subtotal_cents,
    discountCents: r.discount_cents,
    shippingCents: r.shipping_cents,
    totalCents: r.total_cents,
    discountCode: r.discount_code,
    shippingRateId: r.shipping_rate_id,
    shippingMethod: r.shipping_method,
    shippingAddress: r.shipping_address,
    billingAddress: r.billing_address,
    customerNote: r.customer_note,
    paidAt: r.paid_at,
    paymentReference: r.payment_reference,
    trackingNumber: r.tracking_number,
    trackingCarrier: r.tracking_carrier,
    createdAt: r.created_at,
    items: (r.order_items ?? []).map((i) => ({
      productId: i.product_id,
      productSlug: i.product_slug,
      name: i.name,
      color: i.color,
      size: i.size,
      quantity: i.quantity,
      unitPriceCents: i.unit_price_cents,
      measurements: i.measurements,
      measurementUnit: i.measurement_unit,
      notes: i.notes,
    })),
    proofs: (r.payment_proofs ?? [])
      .map((p) => ({ fileName: p.file_name, reference: p.reference, senderName: p.sender_name, createdAt: p.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class SupabaseOrderStore implements OrderStore {
  constructor(private db: SupabaseClient) {}

  async findDiscount(code: string) {
    const { data, error } = await this.db
      .from("discount_codes")
      .select("code, kind, value, min_subtotal_cents, starts_at, expires_at, usage_limit, used_count, active")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(`Discount lookup failed: ${error.message}`);
    if (!data || !data.active) return null;
    const now = Date.now();
    if (data.starts_at && Date.parse(data.starts_at) > now) return null;
    if (data.expires_at && Date.parse(data.expires_at) <= now) return null;
    if (data.usage_limit !== null && data.used_count >= data.usage_limit) return null;
    return { code: data.code, kind: data.kind, value: data.value, minSubtotalCents: data.min_subtotal_cents } as Discount;
  }

  async redeemDiscount(code: string) {
    const { data, error } = await this.db.rpc("redeem_discount", { p_code: code });
    if (error) throw new Error(`Discount redemption failed: ${error.message}`);
    return data === true;
  }

  async create(o: NewOrder) {
    // Only UUIDs reference the catalog; the sample catalog uses slugs as ids.
    const rateId = o.shippingRateId && UUID.test(o.shippingRateId) ? o.shippingRateId : null;
    const { data, error } = await this.db
      .from("orders")
      .insert({
        email: o.email,
        phone: o.phone,
        locale: o.locale,
        marketing_opt_in: o.marketingOptIn,
        payment_method: o.paymentMethod,
        subtotal_cents: o.subtotalCents,
        discount_cents: o.discountCents,
        shipping_cents: o.shippingCents,
        total_cents: o.totalCents,
        discount_code: o.discountCode,
        shipping_rate_id: rateId,
        shipping_method: o.shippingMethod,
        shipping_address: o.shippingAddress,
        billing_address: o.billingAddress,
        customer_note: o.customerNote,
      })
      .select("id")
      .single();
    if (error) throw new Error(`Order insert failed: ${error.message}`);
    const orderId = data.id as string;

    const { error: itemsError } = await this.db.from("order_items").insert(
      o.items.map((i) => ({
        order_id: orderId,
        product_id: i.productId && UUID.test(i.productId) ? i.productId : null,
        product_slug: i.productSlug,
        name: i.name,
        color: i.color,
        size: i.size,
        quantity: i.quantity,
        unit_price_cents: i.unitPriceCents,
        measurements: i.measurements,
        measurement_unit: i.measurementUnit,
        notes: i.notes,
      })),
    );
    if (itemsError) {
      // No multi-statement transactions over the REST API: undo the half-written order.
      await this.db.from("orders").delete().eq("id", orderId);
      throw new Error(`Order items insert failed: ${itemsError.message}`);
    }
    await this.db.from("order_events").insert({ order_id: orderId, status: "awaiting_payment", note: "Order placed" });
    const order = await this.getById(orderId);
    if (!order) throw new Error("Order vanished after insert");
    return order;
  }

  async getById(id: string) {
    if (!UUID.test(id)) return null;
    const { data, error } = await this.db.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
    if (error) throw new Error(`Order lookup failed: ${error.message}`);
    return data ? fromRow(data as OrderRow) : null;
  }

  async getByToken(token: string) {
    if (!/^[0-9a-f]{48}$/.test(token)) return null;
    const { data, error } = await this.db.from("orders").select(ORDER_SELECT).eq("access_token", token).maybeSingle();
    if (error) throw new Error(`Order lookup failed: ${error.message}`);
    return data ? fromRow(data as OrderRow) : null;
  }

  async markPaid(id: string, reference: string | null, note: string) {
    const { data, error } = await this.db
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString(), payment_reference: reference })
      .eq("id", id)
      .eq("status", "awaiting_payment")
      .select("id");
    if (error) throw new Error(`Mark paid failed: ${error.message}`);
    if (!data?.length) return null;
    await this.db.from("order_events").insert({ order_id: id, status: "paid", note });
    return this.getById(id);
  }

  async addProof(orderId: string, file: ProofFile, reference: string | null, senderName: string | null) {
    const storagePath = `${orderId}/${Date.now()}-${randomBytes(4).toString("hex")}.${file.extension}`;
    const { error: uploadError } = await this.db.storage
      .from("payment-proofs")
      .upload(storagePath, file.bytes, { contentType: file.contentType, upsert: false });
    if (uploadError) throw new Error(`Proof upload failed: ${uploadError.message}`);
    const { data, error } = await this.db
      .from("payment_proofs")
      .insert({ order_id: orderId, storage_path: storagePath, file_name: file.fileName, content_type: file.contentType, reference, sender_name: senderName })
      .select("file_name, reference, sender_name, created_at")
      .single();
    if (error) throw new Error(`Proof insert failed: ${error.message}`);
    return { fileName: data.file_name, reference: data.reference, senderName: data.sender_name, createdAt: data.created_at };
  }

  async recordCallback(orderId: string | null, provider: string, payload: unknown, verified: boolean) {
    const { error } = await this.db.from("payment_callbacks").insert({ order_id: orderId, provider, payload, verified });
    if (error) console.error("[orders] callback not recorded", error.message);
  }
}

// ---------------------------------------------------------------------------------------
// Local development: a JSON file, so the whole flow runs without any credentials.

type LocalData = { nextNumber: number; orders: Order[]; discountUses: Record<string, number>; callbacks: unknown[] };

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

class LocalOrderStore implements OrderStore {
  // Serialises writes within this process; good enough for one developer.
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<LocalData> {
    try {
      return JSON.parse(await readFile(DATA_FILE, "utf8")) as LocalData;
    } catch {
      return { nextNumber: 1001, orders: [], discountUses: {}, callbacks: [] };
    }
  }

  private mutate<T>(fn: (d: LocalData) => T | Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const d = await this.read();
      const result = await fn(d);
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(DATA_FILE, JSON.stringify(d, null, 2));
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private seedDiscount(code: string) {
    return seed.discountCodes.find((d) => d.code.toLowerCase() === code.toLowerCase()) ?? null;
  }

  async findDiscount(code: string) {
    const d = this.seedDiscount(code);
    if (!d || Date.parse(d.expiresAt) <= Date.now()) return null;
    const used = (await this.read()).discountUses[d.code] ?? 0;
    if (used >= d.usageLimit) return null;
    return { code: d.code, kind: d.kind, value: d.value, minSubtotalCents: 0 };
  }

  redeemDiscount(code: string) {
    return this.mutate((data) => {
      const d = this.seedDiscount(code);
      if (!d) return false;
      const used = data.discountUses[d.code] ?? 0;
      if (used >= d.usageLimit) return false;
      data.discountUses[d.code] = used + 1;
      return true;
    });
  }

  create(o: NewOrder) {
    return this.mutate((data) => {
      const order: Order = {
        ...o,
        id: randomUUID(),
        number: `JF-${data.nextNumber++}`,
        accessToken: randomBytes(24).toString("hex"),
        status: "awaiting_payment",
        paidAt: null,
        paymentReference: null,
        trackingNumber: null,
        trackingCarrier: null,
        createdAt: new Date().toISOString(),
        proofs: [],
      };
      data.orders.push(order);
      return order;
    });
  }

  async getById(id: string) {
    return (await this.read()).orders.find((o) => o.id === id) ?? null;
  }

  async getByToken(token: string) {
    return (await this.read()).orders.find((o) => o.accessToken === token) ?? null;
  }

  markPaid(id: string, reference: string | null) {
    return this.mutate((data) => {
      const order = data.orders.find((o) => o.id === id);
      if (!order || order.status !== "awaiting_payment") return null;
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      order.paymentReference = reference;
      return order;
    });
  }

  async addProof(orderId: string, file: ProofFile, reference: string | null, senderName: string | null) {
    const dir = path.join(DATA_DIR, "payment-proofs", orderId);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${Date.now()}.${file.extension}`), file.bytes);
    return this.mutate((data) => {
      const proof = { fileName: file.fileName, reference, senderName, createdAt: new Date().toISOString() };
      data.orders.find((o) => o.id === orderId)?.proofs.push(proof);
      return proof;
    });
  }

  async recordCallback(orderId: string | null, provider: string, payload: unknown, verified: boolean) {
    await this.mutate((data) => {
      data.callbacks.push({ orderId, provider, payload, verified, at: new Date().toISOString() });
    });
  }
}

let store: OrderStore | null | undefined;

/**
 * Supabase when the service key is set; the local file store in development; otherwise
 * null (checkout reports itself unavailable instead of losing orders).
 */
export function orderStore(): OrderStore | null {
  if (store !== undefined) return store;
  const db = serviceSupabase();
  if (db) store = new SupabaseOrderStore(db);
  else if (process.env.NODE_ENV !== "production" || process.env.JF_LOCAL_ORDERS === "1") {
    if (publicSupabase()) {
      console.warn("[orders] SUPABASE_SERVICE_ROLE_KEY is not set: orders are stored locally in .data/orders.json");
    }
    store = new LocalOrderStore();
  } else store = null;
  return store;
}

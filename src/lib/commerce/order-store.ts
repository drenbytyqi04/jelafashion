import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { localWrites, mutateLocalDb, readLocalDb } from "@/lib/local-db";
import { publicSupabase } from "@/lib/supabase/public-client";
import { serviceSupabase } from "@/lib/supabase/service-client";
import type { Discount, NewOrder, Order, OrderEvent, OrderStatus, PaymentProof } from "./types";

export type ProofFile = { bytes: Uint8Array; contentType: string; fileName: string; extension: string };
export type ProofDownload = { kind: "url"; url: string } | { kind: "bytes"; bytes: Uint8Array; contentType: string; fileName: string };
export type OrderListFilter = { status?: OrderStatus; query?: string; limit?: number; offset?: number };
export type StatusChange = { note?: string | null; trackingNumber?: string | null; trackingCarrier?: string | null };
export type OrderStats = {
  byStatus: Record<OrderStatus, number>;
  ordersToday: number;
  ordersThisWeek: number;
  paidThisMonthCents: number;
  /** Paid or in production with at least one made-to-measure dress. */
  customInProgress: number;
};

/**
 * Where orders live. Supabase in production (service role, server only); the local
 * development database otherwise. Callers never touch either directly, so checkout,
 * callbacks, accounts and the admin panel share one set of rules.
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
  /** Any other status change (the caller checks the workflow). Null if the status moved meanwhile. */
  setStatus(id: string, from: OrderStatus, to: OrderStatus, change: StatusChange): Promise<Order | null>;
  addProof(orderId: string, file: ProofFile, reference: string | null, senderName: string | null): Promise<PaymentProof>;
  /** Records a proof already uploaded straight to storage (signed upload). */
  attachProof(orderId: string, proof: Omit<PaymentProof, "createdAt">): Promise<PaymentProof>;
  proofDownload(orderId: string, index: number): Promise<ProofDownload | null>;
  recordCallback(orderId: string | null, provider: string, payload: unknown, verified: boolean): Promise<void>;
  /** A customer's orders: placed while signed in, or as a guest with her verified email. */
  listForCustomer(userId: string, email: string): Promise<Order[]>;
  list(filter: OrderListFilter): Promise<{ orders: Order[]; total: number }>;
  events(id: string): Promise<OrderEvent[]>;
  stats(): Promise<OrderStats>;
  /** Orders no admin has opened yet, newest first (for the dashboard and the menu badge). */
  unseen(limit?: number): Promise<{ orders: Order[]; total: number }>;
  /** Marks an order as opened by an admin (first time only). */
  markSeen(id: string): Promise<void>;
}

const emptyByStatus = (): Record<OrderStatus, number> => ({
  awaiting_payment: 0,
  paid: 0,
  in_production: 0,
  shipped: 0,
  delivered: 0,
  cancelled: 0,
});

function periodStarts() {
  const d = new Date();
  const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const week = new Date(day.getTime() - ((day.getUTCDay() + 6) % 7) * 86_400_000); // Monday
  return { today: day.toISOString(), week: week.toISOString(), month: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString() };
}

// ---------------------------------------------------------------------------------------
// Supabase

type OrderRow = {
  id: string;
  number: string;
  access_token: string;
  user_id: string | null;
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
  seen_at?: string | null;
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
  payment_proofs?: { storage_path: string; file_name: string; content_type: string; reference: string | null; sender_name: string | null; created_at: string }[];
};

const ORDER_SELECT = `*, order_items (product_id, product_slug, name, color, size, quantity, unit_price_cents, measurements, measurement_unit, notes),
  payment_proofs (storage_path, file_name, content_type, reference, sender_name, created_at)`;

function fromRow(r: OrderRow): Order {
  return {
    id: r.id,
    number: r.number,
    accessToken: r.access_token,
    userId: r.user_id,
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
    seenAt: r.seen_at ?? null,
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
      .map((p) => ({
        path: p.storage_path,
        fileName: p.file_name,
        contentType: p.content_type,
        reference: p.reference,
        senderName: p.sender_name,
        createdAt: p.created_at,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Characters that would change the meaning of a PostgREST filter. */
const safeSearch = (q: string) => q.replace(/[,()*%\\]/g, " ").trim();

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
        user_id: o.userId,
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
    await this.db.from("order_events").insert({ order_id: orderId, status: "awaiting_payment", note: "Porosia u bë" });
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

  async setStatus(id: string, from: OrderStatus, to: OrderStatus, change: StatusChange) {
    const patch: Record<string, unknown> = { status: to };
    if (change.trackingNumber !== undefined) patch.tracking_number = change.trackingNumber;
    if (change.trackingCarrier !== undefined) patch.tracking_carrier = change.trackingCarrier;
    const { data, error } = await this.db.from("orders").update(patch).eq("id", id).eq("status", from).select("id");
    if (error) throw new Error(`Status update failed: ${error.message}`);
    if (!data?.length) return null;
    await this.db.from("order_events").insert({ order_id: id, status: to, note: change.note ?? null });
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
      .select("storage_path, file_name, content_type, reference, sender_name, created_at")
      .single();
    if (error) throw new Error(`Proof insert failed: ${error.message}`);
    return {
      path: data.storage_path,
      fileName: data.file_name,
      contentType: data.content_type,
      reference: data.reference,
      senderName: data.sender_name,
      createdAt: data.created_at,
    };
  }

  async attachProof(orderId: string, p: Omit<PaymentProof, "createdAt">) {
    const { data, error } = await this.db
      .from("payment_proofs")
      .insert({ order_id: orderId, storage_path: p.path, file_name: p.fileName, content_type: p.contentType, reference: p.reference, sender_name: p.senderName })
      .select("created_at")
      .single();
    if (error) throw new Error(`Proof insert failed: ${error.message}`);
    return { ...p, createdAt: data.created_at };
  }

  async proofDownload(orderId: string, index: number): Promise<ProofDownload | null> {
    const order = await this.getById(orderId);
    const proof = order?.proofs[index];
    if (!proof) return null;
    // Short-lived link: proofs are private and the URL may end up in browser history.
    const { data, error } = await this.db.storage.from("payment-proofs").createSignedUrl(proof.path, 60);
    if (error || !data) throw new Error(`Signed URL failed: ${error?.message}`);
    return { kind: "url", url: data.signedUrl };
  }

  async recordCallback(orderId: string | null, provider: string, payload: unknown, verified: boolean) {
    const { error } = await this.db.from("payment_callbacks").insert({ order_id: orderId, provider, payload, verified });
    if (error) console.error("[orders] callback not recorded", error.message);
  }

  async listForCustomer(userId: string, email: string) {
    const { data, error } = await this.db
      .from("orders")
      .select(ORDER_SELECT)
      .or(`user_id.eq.${userId},email.eq.${safeSearch(email)}`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(`Customer orders failed: ${error.message}`);
    return (data as OrderRow[]).map(fromRow);
  }

  async list({ status, query, limit = 50, offset = 0 }: OrderListFilter) {
    let q = this.db.from("orders").select(ORDER_SELECT, { count: "exact" });
    if (status) q = q.eq("status", status);
    const term = query ? safeSearch(query) : "";
    if (term) q = q.or(`number.ilike.*${term}*,email.ilike.*${term}*`);
    const { data, error, count } = await q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new Error(`Order list failed: ${error.message}`);
    return { orders: (data as OrderRow[]).map(fromRow), total: count ?? 0 };
  }

  async unseen(limit = 10) {
    const { data, error, count } = await this.db
      .from("orders")
      .select(ORDER_SELECT, { count: "exact" })
      .is("seen_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Unseen orders failed: ${error.message}`);
    return { orders: (data as OrderRow[]).map(fromRow), total: count ?? 0 };
  }

  async markSeen(id: string) {
    if (!UUID.test(id)) return;
    const { error } = await this.db.from("orders").update({ seen_at: new Date().toISOString() }).eq("id", id).is("seen_at", null);
    if (error) console.error("[orders] mark seen failed", error.message);
  }

  async events(id: string) {
    const { data, error } = await this.db.from("order_events").select("status, note, created_at").eq("order_id", id).order("created_at");
    if (error) throw new Error(`Order events failed: ${error.message}`);
    return data.map((e) => ({ status: e.status, note: e.note, createdAt: e.created_at }));
  }

  async stats() {
    const { data, error } = await this.db.from("orders").select("status, total_cents, paid_at, created_at, order_items (size)");
    if (error) throw new Error(`Order stats failed: ${error.message}`);
    return computeStats(
      data.map((r) => ({
        status: r.status,
        totalCents: r.total_cents,
        paidAt: r.paid_at,
        createdAt: r.created_at,
        items: (r.order_items as { size: string }[]).map((i) => ({ size: i.size })),
      })),
    );
  }
}

function computeStats(
  rows: { status: OrderStatus; totalCents: number; paidAt: string | null; createdAt: string; items: { size: string }[] }[],
): OrderStats {
  const since = periodStarts();
  const stats: OrderStats = { byStatus: emptyByStatus(), ordersToday: 0, ordersThisWeek: 0, paidThisMonthCents: 0, customInProgress: 0 };
  for (const r of rows) {
    stats.byStatus[r.status]++;
    if (r.createdAt >= since.today) stats.ordersToday++;
    if (r.createdAt >= since.week) stats.ordersThisWeek++;
    if (r.paidAt && r.paidAt >= since.month && r.status !== "cancelled") stats.paidThisMonthCents += r.totalCents;
    if ((r.status === "paid" || r.status === "in_production") && r.items.some((i) => i.size === "custom")) stats.customInProgress++;
  }
  return stats;
}

// ---------------------------------------------------------------------------------------
// Local development database

const PROOF_DIR = path.join(process.cwd(), ".data", "payment-proofs");

class LocalOrderStore implements OrderStore {
  async findDiscount(code: string) {
    const db = await readLocalDb();
    const d = db.discounts.find((x) => x.code.toLowerCase() === code.toLowerCase());
    const now = new Date().toISOString();
    if (!d || !d.active) return null;
    if ((d.startsAt && d.startsAt > now) || (d.expiresAt && d.expiresAt <= now)) return null;
    if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return null;
    return { code: d.code, kind: d.kind, value: d.value, minSubtotalCents: d.minSubtotalCents };
  }

  redeemDiscount(code: string) {
    return mutateLocalDb((db) => {
      const d = db.discounts.find((x) => x.code.toLowerCase() === code.toLowerCase());
      if (!d || !d.active || (d.usageLimit !== null && d.usedCount >= d.usageLimit)) return false;
      d.usedCount++;
      return true;
    });
  }

  create(o: NewOrder) {
    return mutateLocalDb((db) => {
      const now = new Date().toISOString();
      const order = {
        ...o,
        id: randomUUID(),
        number: `JF-${db.nextOrderNumber++}`,
        accessToken: randomBytes(24).toString("hex"),
        status: "awaiting_payment" as const,
        paidAt: null,
        paymentReference: null,
        trackingNumber: null,
        trackingCarrier: null,
        createdAt: now,
        seenAt: null,
        proofs: [],
        events: [{ status: "awaiting_payment", note: "Porosia u bë", createdAt: now }],
      };
      db.orders.push(order);
      return strip(order);
    });
  }

  async getById(id: string) {
    const o = (await readLocalDb()).orders.find((x) => x.id === id);
    return o ? strip(o) : null;
  }

  async getByToken(token: string) {
    const o = (await readLocalDb()).orders.find((x) => x.accessToken === token);
    return o ? strip(o) : null;
  }

  markPaid(id: string, reference: string | null, note: string) {
    return mutateLocalDb((db) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order || order.status !== "awaiting_payment") return null;
      order.status = "paid";
      order.paidAt = new Date().toISOString();
      order.paymentReference = reference;
      order.events.push({ status: "paid", note, createdAt: order.paidAt });
      return strip(order);
    });
  }

  setStatus(id: string, from: OrderStatus, to: OrderStatus, change: StatusChange) {
    return mutateLocalDb((db) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order || order.status !== from) return null;
      order.status = to;
      if (change.trackingNumber !== undefined) order.trackingNumber = change.trackingNumber;
      if (change.trackingCarrier !== undefined) order.trackingCarrier = change.trackingCarrier;
      order.events.push({ status: to, note: change.note ?? null, createdAt: new Date().toISOString() });
      return strip(order);
    });
  }

  async addProof(orderId: string, file: ProofFile, reference: string | null, senderName: string | null) {
    const rel = `${orderId}/${Date.now()}-${randomBytes(4).toString("hex")}.${file.extension}`;
    await mkdir(path.join(PROOF_DIR, orderId), { recursive: true });
    await writeFile(path.join(PROOF_DIR, rel), file.bytes);
    return mutateLocalDb((db) => {
      const proof = { path: rel, fileName: file.fileName, contentType: file.contentType, reference, senderName, createdAt: new Date().toISOString() };
      db.orders.find((o) => o.id === orderId)?.proofs.push(proof);
      return proof;
    });
  }

  attachProof(orderId: string, p: Omit<PaymentProof, "createdAt">) {
    return mutateLocalDb((db) => {
      const proof = { ...p, createdAt: new Date().toISOString() };
      db.orders.find((o) => o.id === orderId)?.proofs.push(proof);
      return proof;
    });
  }

  async proofDownload(orderId: string, index: number): Promise<ProofDownload | null> {
    const proof = (await this.getById(orderId))?.proofs[index];
    if (!proof) return null;
    const bytes = await readFile(path.join(PROOF_DIR, proof.path));
    return { kind: "bytes", bytes, contentType: proof.contentType, fileName: proof.fileName };
  }

  async recordCallback(orderId: string | null, provider: string, payload: unknown, verified: boolean) {
    await mutateLocalDb((db) => {
      db.callbacks.push({ orderId, provider, payload, verified, at: new Date().toISOString() });
    });
  }

  async listForCustomer(userId: string, email: string) {
    const db = await readLocalDb();
    return db.orders
      .filter((o) => o.userId === userId || o.email.toLowerCase() === email.toLowerCase())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(strip);
  }

  async list({ status, query, limit = 50, offset = 0 }: OrderListFilter) {
    const term = query?.trim().toLowerCase();
    const all = (await readLocalDb()).orders
      .filter((o) => !status || o.status === status)
      .filter((o) => !term || o.number.toLowerCase().includes(term) || o.email.toLowerCase().includes(term))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { orders: all.slice(offset, offset + limit).map(strip), total: all.length };
  }

  async unseen(limit = 10) {
    const all = (await readLocalDb()).orders.filter((o) => !o.seenAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { orders: all.slice(0, limit).map(strip), total: all.length };
  }

  async markSeen(id: string) {
    await mutateLocalDb((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (o && !o.seenAt) o.seenAt = new Date().toISOString();
    });
  }

  async events(id: string) {
    return (await readLocalDb()).orders.find((o) => o.id === id)?.events ?? [];
  }

  async stats() {
    return computeStats((await readLocalDb()).orders);
  }
}

/** The local record keeps its event log inline; callers get the plain Order. */
function strip<T extends Order & { events?: unknown }>(o: T): Order {
  const { events: _events, ...order } = o;
  void _events;
  return order;
}

let store: OrderStore | null | undefined;

/**
 * Supabase when the service key is set; the local database in development; otherwise null
 * (checkout and the admin report themselves unavailable instead of losing orders).
 */
export function orderStore(): OrderStore | null {
  if (store !== undefined) return store;
  const db = serviceSupabase();
  if (db) store = new SupabaseOrderStore(db);
  else if (localWrites()) {
    if (publicSupabase()) {
      console.warn("[orders] SUPABASE_SERVICE_ROLE_KEY is not set: orders are stored locally in .data/db.json");
    }
    store = new LocalOrderStore();
  } else store = null;
  return store;
}

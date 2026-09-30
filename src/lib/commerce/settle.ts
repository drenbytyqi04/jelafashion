import "server-only";
import { sendOrderConfirmation, sendShopPaid, sendStatusUpdate } from "@/lib/email/notifications";
import type { OrderStore } from "./order-store";
import type { Order } from "./types";

/**
 * Marks an order paid exactly once and sends the emails that go with it. Card orders get
 * their full confirmation now (nothing was sent at checkout); offline orders, which already
 * had one with payment instructions, get "payment received".
 */
export async function settlePaidOrder(store: OrderStore, order: Order, reference: string | null, note: string, origin: string) {
  const paid = await store.markPaid(order.id, reference, note);
  if (!paid) return null; // already paid or cancelled: nothing to do, no duplicate emails
  if (paid.paymentMethod === "paysera") {
    await Promise.all([sendOrderConfirmation(paid, origin), sendShopPaid(paid, origin)]);
  } else {
    await sendStatusUpdate(paid, origin, "paid");
  }
  return paid;
}

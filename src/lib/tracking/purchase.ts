import type { Order } from "@/lib/commerce/types";

/**
 * When an order counts as a purchase for ads and analytics: card orders once Paysera
 * confirmed payment; offline orders (bank, agency, Wise) when placed, since the customer
 * has committed and pays outside the site.
 */
export function purchaseIsFinal(order: Pick<Order, "paymentMethod" | "status">) {
  if (order.status === "cancelled") return false;
  return order.paymentMethod === "paysera" ? order.status !== "awaiting_payment" : true;
}

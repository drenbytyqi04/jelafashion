import type { OrderStatus } from "./types";

/**
 * Awaiting payment → Paid → In production → Shipped → Delivered, with Cancelled possible
 * until the dress ships. Anything else is refused on the server.
 */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  awaiting_payment: ["paid", "cancelled"],
  paid: ["in_production", "cancelled"],
  in_production: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const canMove = (from: OrderStatus, to: OrderStatus) => NEXT_STATUSES[from].includes(to);

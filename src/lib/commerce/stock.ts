import "server-only";
import { mutateLocalDb } from "@/lib/local-db";
import { serviceSupabase } from "@/lib/supabase/service-client";
import { localWrites } from "@/lib/local-db";
import type { OrderItem } from "./types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Takes (direction -1) or returns (+1) standard-size stock for an order's items. Only
 * products sold from stock are counted; made-to-order and custom sizes are ignored.
 * Best effort per line: a failure is logged, never blocks the order.
 */
export async function moveStock(items: OrderItem[], inStockProductIds: Set<string>, direction: 1 | -1) {
  const lines = items.filter((i) => i.size !== "custom" && i.productId && inStockProductIds.has(i.productId));
  if (!lines.length) return;
  const db = serviceSupabase();
  if (db) {
    await Promise.all(
      lines
        .filter((l) => UUID.test(l.productId!))
        .map(async (l) => {
          const { data, error } = await db.rpc("adjust_stock", { p_product: l.productId, p_size: l.size, p_delta: direction * l.quantity });
          if (error || data !== true) console.warn(`[stock] ${l.productSlug} ${l.size} ${direction * l.quantity} not applied`, error?.message ?? "");
        }),
    );
    return;
  }
  if (!localWrites()) return;
  await mutateLocalDb((local) => {
    for (const l of lines) {
      const size = local.products.find((p) => p.id === l.productId)?.sizes.find((s) => s.size === l.size);
      if (size && size.stock + direction * l.quantity >= 0) size.stock += direction * l.quantity;
    }
  });
}

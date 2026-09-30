"use server";

import { z } from "zod";
import { orderStore } from "@/lib/commerce/order-store";
import { purchaseIsFinal } from "@/lib/tracking/purchase";
import { sendMetaPurchase } from "@/lib/tracking/meta-capi";

/**
 * Called by the order page after the visitor consented to marketing: sends the server-side
 * Purchase for an order she can see (her secret token), only once it counts as a purchase.
 */
export async function reportPurchase(input: unknown): Promise<void> {
  const parsed = z.object({ token: z.string().regex(/^[0-9a-f]{48}$/), url: z.string().url().max(500) }).safeParse(input);
  if (!parsed.success) return;
  const order = await orderStore()?.getByToken(parsed.data.token);
  if (!order || !purchaseIsFinal(order)) return;
  await sendMetaPurchase(order, parsed.data.url);
}

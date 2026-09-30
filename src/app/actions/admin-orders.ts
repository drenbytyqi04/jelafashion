"use server";

import { revalidatePath, updateTag } from "next/cache";
import { catalogAdminStore } from "@/lib/admin/catalog-store";
import { CATALOG_TAG } from "@/lib/catalog/repository";
import { moveStock } from "@/lib/commerce/stock";
import { z } from "zod";
import { adminOrNull } from "@/lib/auth/viewer";
import { orderStore } from "@/lib/commerce/order-store";
import { settlePaidOrder } from "@/lib/commerce/settle";
import { ORDER_STATUSES } from "@/lib/commerce/types";
import { canMove } from "@/lib/commerce/workflow";
import { sendStatusUpdate } from "@/lib/email/notifications";
import { siteOrigin } from "@/lib/site-origin";

const schema = z.object({
  orderId: z.string().min(1).max(64),
  to: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional().transform((v) => v || null),
  reference: z.string().trim().max(120).optional().transform((v) => v || null),
  trackingNumber: z.string().trim().max(80).optional().transform((v) => v || null),
  trackingCarrier: z.string().trim().max(80).optional().transform((v) => v || null),
});

export type OrderActionResult = { ok: true } | { ok: false; error: string };

/**
 * Moves an order along the workflow and emails the customer in her language. "Paid" goes
 * through the same path as a verified card payment, so the emails match.
 */
export async function changeOrderStatus(input: unknown): Promise<OrderActionResult> {
  const admin = await adminOrNull();
  if (!admin) return { ok: false, error: "Nuk ke qasje." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Të dhëna të pavlefshme." };
  const v = parsed.data;
  const store = orderStore();
  if (!store) return { ok: false, error: "Porositë nuk janë të disponueshme." };

  try {
    const order = await store.getById(v.orderId);
    if (!order) return { ok: false, error: "Porosia nuk u gjet." };
    if (!canMove(order.status, v.to)) return { ok: false, error: "Ky ndryshim statusi nuk lejohet." };
    const origin = await siteOrigin();
    const by = `${admin.email}${v.note ? `: ${v.note}` : ""}`;

    if (v.to === "paid") {
      const paid = await settlePaidOrder(store, order, v.reference, `Shënuar si e paguar nga ${by}`, origin);
      if (!paid) return { ok: false, error: "Statusi ndryshoi ndërkohë. Rifresko faqen." };
    } else {
      if (v.to === "shipped" && !v.trackingNumber) return { ok: false, error: "Shkruaj numrin e gjurmimit." };
      const updated = await store.setStatus(order.id, order.status, v.to, {
        note: by,
        ...(v.to === "shipped" && { trackingNumber: v.trackingNumber, trackingCarrier: v.trackingCarrier }),
      });
      if (!updated) return { ok: false, error: "Statusi ndryshoi ndërkohë. Rifresko faqen." };
      if (v.to === "cancelled") {
        // A cancelled, unshipped order gives its pieces back to stock.
        const products = (await catalogAdminStore()?.products()) ?? [];
        await moveStock(updated.items, new Set(products.filter((p) => p.availability === "in_stock").map((p) => p.id)), 1);
        updateTag(CATALOG_TAG);
      }
      await sendStatusUpdate(updated, origin, v.to);
    }
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (err) {
    console.error("[admin] status change failed", err);
    return { ok: false, error: "Ndryshimi nuk u ruajt. Provo sërish." };
  }
}

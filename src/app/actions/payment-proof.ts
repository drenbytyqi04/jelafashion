"use server";

import { after } from "next/server";
import { z } from "zod";
import { orderStore } from "@/lib/commerce/order-store";
import type { PaymentProof } from "@/lib/commerce/types";
import { OFFLINE_METHODS } from "@/lib/commerce/types";
import { sendShopNewProof } from "@/lib/email/notifications";
import { siteOrigin } from "@/lib/site-origin";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PROOFS = 5;

const fieldsSchema = z.object({
  token: z.string().regex(/^[0-9a-f]{48}$/),
  reference: z.string().trim().max(80).optional().transform((v) => v || null),
  senderName: z.string().trim().max(120).optional().transform((v) => v || null),
});

/** Identify by content, not by the name or the browser's claimed type. */
function sniff(bytes: Uint8Array): { contentType: string; extension: string } | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (starts(0xff, 0xd8, 0xff)) return { contentType: "image/jpeg", extension: "jpg" };
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { contentType: "image/png", extension: "png" };
  if (starts(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  if (starts(0x25, 0x50, 0x44, 0x46)) return { contentType: "application/pdf", extension: "pdf" };
  return null;
}

export type ProofResult = { ok: true; proof: PaymentProof } | { ok: false; error: "file" | "size" | "type" | "closed" | "failure" };

/** Guests prove access with the order's secret token (from the confirmation link or email). */
export async function uploadPaymentProof(formData: FormData): Promise<ProofResult> {
  const fields = fieldsSchema.safeParse({
    token: formData.get("token"),
    reference: formData.get("reference") ?? undefined,
    senderName: formData.get("senderName") ?? undefined,
  });
  if (!fields.success) return { ok: false, error: "failure" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "size" };

  const store = orderStore();
  if (!store) return { ok: false, error: "failure" };
  try {
    const order = await store.getByToken(fields.data.token);
    if (!order) return { ok: false, error: "failure" };
    if (order.status !== "awaiting_payment" || !OFFLINE_METHODS.includes(order.paymentMethod) || order.proofs.length >= MAX_PROOFS) {
      return { ok: false, error: "closed" };
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniff(bytes);
    if (!kind) return { ok: false, error: "type" };
    const fileName = file.name.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(-120) || `proof.${kind.extension}`;
    const proof = await store.addProof(order.id, { bytes, fileName, ...kind }, fields.data.reference, fields.data.senderName);
    const origin = await siteOrigin();
    after(() => sendShopNewProof(order, origin, fields.data.reference, fields.data.senderName).then(() => undefined));
    return { ok: true, proof };
  } catch (err) {
    console.error("[proof] upload failed", err);
    return { ok: false, error: "failure" };
  }
}

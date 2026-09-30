"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { orderStore } from "@/lib/commerce/order-store";
import type { Order, PaymentProof } from "@/lib/commerce/types";
import { OFFLINE_METHODS } from "@/lib/commerce/types";
import { sendShopNewProof } from "@/lib/email/notifications";
import { siteOrigin } from "@/lib/site-origin";
import { downloadObject, removeObject, uploadTicket, type UploadTicket } from "@/lib/storage/signed-upload";
import { EXTENSIONS, sniffFile } from "@/lib/storage/sniff";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_PROOFS = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const BUCKET = "payment-proofs";

const token = z.string().regex(/^[0-9a-f]{48}$/);
const details = {
  reference: z.string().trim().max(80).optional().transform((v) => v || null),
  senderName: z.string().trim().max(120).optional().transform((v) => v || null),
};

export type ProofError = "file" | "size" | "type" | "closed" | "failure";
export type ProofResult = { ok: true; proof: PaymentProof } | { ok: false; error: ProofError };

const cleanName = (name: string, extension: string) => name.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(-120) || `proof.${extension}`;

/** Guests prove access with the order's secret token (from the confirmation link or email). */
async function openOrder(t: string): Promise<{ order: Order } | { error: "closed" | "failure" }> {
  const store = orderStore();
  const order = store ? await store.getByToken(t) : null;
  if (!order) return { error: "failure" };
  if (order.status !== "awaiting_payment" || !OFFLINE_METHODS.includes(order.paymentMethod) || order.proofs.length >= MAX_PROOFS) {
    return { error: "closed" };
  }
  return { order };
}

async function announce(order: Order, reference: string | null, sender: string | null) {
  const origin = await siteOrigin();
  after(() => sendShopNewProof(order, origin, reference, sender).then(() => undefined));
}

/** Step 1 (production): a signed URL for the browser to upload to storage directly. */
export async function startProofUpload(input: unknown): Promise<{ ok: true; ticket: UploadTicket } | { ok: false; error: ProofError }> {
  const parsed = z.object({ token, contentType: z.string(), size: z.number().int().positive() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "failure" };
  if (!ACCEPTED.includes(parsed.data.contentType)) return { ok: false, error: "type" };
  if (parsed.data.size > MAX_BYTES) return { ok: false, error: "size" };
  try {
    const opened = await openOrder(parsed.data.token);
    if ("error" in opened) return { ok: false, error: opened.error };
    const path = `${opened.order.id}/${Date.now()}-${randomBytes(4).toString("hex")}.${EXTENSIONS[parsed.data.contentType]}`;
    return { ok: true, ticket: await uploadTicket(BUCKET, path) };
  } catch (err) {
    console.error("[proof] ticket failed", err);
    return { ok: false, error: "failure" };
  }
}

/** Step 2: check what was uploaded, then record it. Anything that isn't an image or PDF is deleted. */
export async function finishProofUpload(input: unknown): Promise<ProofResult> {
  const parsed = z.object({ token, path: z.string().max(200), fileName: z.string().max(300), ...details }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "failure" };
  const v = parsed.data;
  try {
    const opened = await openOrder(v.token);
    if ("error" in opened) return { ok: false, error: opened.error };
    const { order } = opened;
    if (!v.path.startsWith(`${order.id}/`) || v.path.includes("..")) return { ok: false, error: "failure" };
    const bytes = await downloadObject(BUCKET, v.path);
    if (!bytes) return { ok: false, error: "file" };
    const kind = sniffFile(bytes);
    if (!kind || !ACCEPTED.includes(kind.contentType) || bytes.byteLength > MAX_BYTES) {
      await removeObject(BUCKET, v.path);
      return { ok: false, error: bytes.byteLength > MAX_BYTES ? "size" : "type" };
    }
    const proof = await orderStore()!.attachProof(order.id, {
      path: v.path,
      fileName: cleanName(v.fileName, kind.extension),
      contentType: kind.contentType,
      reference: v.reference,
      senderName: v.senderName,
    });
    await announce(order, v.reference, v.senderName);
    return { ok: true, proof };
  } catch (err) {
    console.error("[proof] finish failed", err);
    return { ok: false, error: "failure" };
  }
}

/** Local development (no Supabase): the file comes through the Server Action. */
export async function uploadPaymentProof(formData: FormData): Promise<ProofResult> {
  const fields = z.object({ token, ...details }).safeParse({
    token: formData.get("token"),
    reference: formData.get("reference") ?? undefined,
    senderName: formData.get("senderName") ?? undefined,
  });
  if (!fields.success) return { ok: false, error: "failure" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "file" };
  if (file.size > MAX_BYTES) return { ok: false, error: "size" };
  try {
    const opened = await openOrder(fields.data.token);
    if ("error" in opened) return { ok: false, error: opened.error };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniffFile(bytes);
    if (!kind || !ACCEPTED.includes(kind.contentType)) return { ok: false, error: "type" };
    const proof = await orderStore()!.addProof(
      opened.order.id,
      { bytes, fileName: cleanName(file.name, kind.extension), ...kind },
      fields.data.reference,
      fields.data.senderName,
    );
    await announce(opened.order, fields.data.reference, fields.data.senderName);
    return { ok: true, proof };
  } catch (err) {
    console.error("[proof] upload failed", err);
    return { ok: false, error: "failure" };
  }
}

import "server-only";
import { serviceSupabase } from "@/lib/supabase/service-client";

export type UploadTicket = { mode: "signed"; signedUrl: string; path: string } | { mode: "direct" };

/**
 * Files go straight from the browser to Supabase Storage with a one-time signed URL:
 * Vercel functions accept at most 4.5 MB per request, so large proofs, photos and videos
 * must not pass through the server. Without Supabase (local development) the caller falls
 * back to a Server Action upload.
 */
export async function uploadTicket(bucket: string, path: string): Promise<UploadTicket> {
  const db = serviceSupabase();
  if (!db) return { mode: "direct" };
  const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Signed upload URL failed: ${error?.message}`);
  return { mode: "signed", signedUrl: data.signedUrl, path: data.path };
}

/** Reads back an uploaded object (to check what it really is). */
export async function downloadObject(bucket: string, path: string): Promise<Uint8Array | null> {
  const db = serviceSupabase();
  if (!db) return null;
  const { data, error } = await db.storage.from(bucket).download(path);
  if (error || !data) return null;
  return new Uint8Array(await data.arrayBuffer());
}

export async function removeObject(bucket: string, path: string) {
  await serviceSupabase()?.storage.from(bucket).remove([path]);
}

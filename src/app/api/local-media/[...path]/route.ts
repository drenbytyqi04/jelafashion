import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_MEDIA_DIR, localDataEnabled } from "@/lib/local-db";

// Serves images and videos uploaded in the admin panel during local development (the
// production equivalent is Supabase Storage's public buckets). Public buckets only.

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
};
const BUCKETS = new Set(["product-images", "site-media"]);

export async function GET(_: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await ctx.params;
  if (!localDataEnabled() || !BUCKETS.has(parts[0]) || parts.some((p) => p === ".." || p.includes("/"))) {
    return new Response("Not found", { status: 404 });
  }
  const file = path.join(LOCAL_MEDIA_DIR, ...parts);
  if (!file.startsWith(LOCAL_MEDIA_DIR + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const bytes = await readFile(file);
    const ext = file.split(".").pop()?.toLowerCase() ?? "";
    return new Response(bytes, { headers: { "content-type": TYPES[ext] ?? "application/octet-stream", "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

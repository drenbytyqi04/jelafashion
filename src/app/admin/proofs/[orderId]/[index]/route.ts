import { getViewer } from "@/lib/auth/viewer";
import { orderStore } from "@/lib/commerce/order-store";

// Payment proofs are private: admins get a 60-second signed link (Supabase) or the bytes
// (local development). Everyone else gets a 404, never a hint the file exists.
export async function GET(_: Request, ctx: { params: Promise<{ orderId: string; index: string }> }) {
  const viewer = await getViewer();
  const notFound = () => new Response("Not found", { status: 404 });
  if (viewer?.role !== "admin") return notFound();
  const { orderId, index } = await ctx.params;
  const download = await orderStore()?.proofDownload(orderId, Number(index));
  if (!download) return notFound();
  if (download.kind === "url") return Response.redirect(download.url, 302);
  return new Response(Buffer.from(download.bytes), {
    headers: {
      "content-type": download.contentType,
      "content-disposition": `inline; filename="${encodeURIComponent(download.fileName)}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

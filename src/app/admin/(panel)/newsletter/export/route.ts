import { getViewer } from "@/lib/auth/viewer";
import { catalogAdminStore } from "@/lib/admin/catalog-store";

export async function GET() {
  const viewer = await getViewer();
  if (viewer?.role !== "admin") return new Response("Not found", { status: 404 });
  const store = catalogAdminStore();
  if (!store) return new Response("Unavailable", { status: 503 });
  const rows = (await store.subscribers()).filter((s) => !s.unsubscribed);
  // A leading = + - @ would run as a formula in a spreadsheet.
  const safe = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);
  // BOM so Excel opens UTF-8 correctly.
  const csv = "\uFEFF" + ["email,locale,subscribed_at", ...rows.map((s) => `${safe(s.email)},${s.locale},${s.createdAt}`)].join("\r\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}

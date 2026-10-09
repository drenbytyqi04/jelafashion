import { adminOrNull } from "@/lib/auth/viewer";
import { measurementSheetPdf } from "@/lib/admin/measurement-pdf";
import { getCatalog } from "@/lib/catalog/repository";
import { orderStore } from "@/lib/commerce/order-store";

// Downloads the A4 measurement sheet as a PDF file (admins only).
export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  if (!(await adminOrNull())) return new Response("Not found", { status: 404 });
  const { orderId } = await params;
  const order = await orderStore()?.getById(orderId);
  if (!order) return new Response("Not found", { status: 404 });
  const catalog = await getCatalog();
  const pdf = await measurementSheetPdf(order, (slug) => catalog.find((p) => p.slug === slug)?.images[0]?.url);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.number}-masat.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import {
  clip,
  endPath,
  PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  StandardFonts,
} from "pdf-lib";
import type { Order } from "@/lib/commerce/types";
import { formatDate } from "@/lib/format";
import { formatMeasure } from "@/lib/units";

// The A4 measurement sheet as a downloadable PDF: the same content and layout as the print
// view (/admin/print/[orderId]), one page per made-to-measure dress, ink only.

const A4 = { w: 595.28, h: 841.89 };
const M = 40; // ~14 mm, as the print view's @page margin
const INK = rgb(0.11, 0.1, 0.09);
const RULE = rgb(0.78, 0.76, 0.74);
const PAPER = rgb(0.95, 0.93, 0.89);

type Fonts = { serif: PDFFont; sans: PDFFont };

/** Draws `text` letter-spaced (the wordmark's wide tracking); pdf-lib has no tracking option. */
function tracked(page: PDFPage, text: string, x: number, y: number, size: number, font: PDFFont, spacing: number) {
  let cx = x;
  for (const ch of text) {
    page.drawText(ch, { x: cx, y, size, font, color: INK });
    cx += font.widthOfTextAtSize(ch, size) + spacing;
  }
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
  }
  return lines;
}

/** Image cropped to fill the box (object-fit: cover). */
function drawCover(page: PDFPage, img: PDFImage, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  page.pushOperators(pushGraphicsState(), rectangle(x, y, w, h), clip(), endPath());
  page.drawImage(img, { x: x + (w - dw) / 2, y: y + (h - dh) / 2, width: dw, height: dh });
  page.pushOperators(popGraphicsState());
}

async function loadImage(doc: PDFDocument, url: string | undefined): Promise<PDFImage | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const type = res.headers.get("content-type") ?? "";
    if (type.includes("png") || (bytes[0] === 0x89 && bytes[1] === 0x50)) return await doc.embedPng(bytes);
    if (type.includes("jpeg") || type.includes("jpg") || (bytes[0] === 0xff && bytes[1] === 0xd8)) return await doc.embedJpg(bytes);
    return null; // WebP/AVIF: the sheet still works, with an empty frame
  } catch {
    return null;
  }
}

export async function measurementSheetPdf(order: Order, imageFor: (slug: string) => string | undefined): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`${order.number} · Fleta e masave`);
  doc.setAuthor("Jela Fashion");
  // Manrope is embedded (literal path, so the deployment's file tracing bundles it, as for
  // the OG image). The serif is the PDF's built-in Times: fontkit can't parse the glyph
  // outlines of our Cormorant build, and Times covers ë and ç.
  const sansBytes = await readFile(path.join(process.cwd(), "assets/fonts/Manrope-Medium.ttf"));
  const fonts: Fonts = {
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    sans: await doc.embedFont(sansBytes, { subset: true }),
  };

  const items = order.items.filter((i) => i.measurements);
  for (const [idx, item] of items.entries()) {
    const page = doc.addPage([A4.w, A4.h]);
    const { serif, sans } = fonts;
    let y = A4.h - M;

    // Header: wordmark left, order · date · n/N right, ink rule under.
    tracked(page, "JELA FASHION", M, y - 14, 15, serif, 4.2);
    const meta = `${order.number} · ${formatDate(order.createdAt, "sq")} · ${idx + 1}/${items.length}`;
    page.drawText(meta, { x: A4.w - M - sans.widthOfTextAtSize(meta, 9), y: y - 12, size: 9, font: sans, color: INK });
    y -= 24;
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.8, color: INK });
    y -= 20;

    // Left column: photo (3:4), dress, colour and quantity, customer.
    const contentW = A4.w - 2 * M;
    const leftW = contentW * 0.38;
    const imgH = (leftW * 4) / 3;
    const imgY = y - imgH;
    page.drawRectangle({ x: M, y: imgY, width: leftW, height: imgH, color: PAPER });
    const img = await loadImage(doc, imageFor(item.productSlug));
    if (img) drawCover(page, img, M, imgY, leftW, imgH);
    let ly = imgY - 24;
    page.drawText(item.name, { x: M, y: ly, size: 20, font: serif, color: INK });
    ly -= 16;
    page.drawText([item.color, `Sasia ${item.quantity}`].filter(Boolean).join(" · "), { x: M, y: ly, size: 9, font: sans, color: INK });
    ly -= 24;
    page.drawText(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`, { x: M, y: ly, size: 9, font: sans, color: INK });
    ly -= 13;
    page.drawText(order.phone, { x: M, y: ly, size: 9, font: sans, color: INK });

    // Right column: measurements in cm, then notes.
    const rx = M + leftW + 24;
    const rw = A4.w - M - rx;
    let ry = y - 4;
    page.drawText("Masa", { x: rx, y: ry - 10, size: 10, font: sans, color: INK });
    page.drawText("cm", { x: rx + rw - sans.widthOfTextAtSize("cm", 10), y: ry - 10, size: 10, font: sans, color: INK });
    ry -= 18;
    page.drawLine({ start: { x: rx, y: ry }, end: { x: rx + rw, y: ry }, thickness: 0.8, color: INK });
    for (const m of item.measurements!) {
      const value = formatMeasure(m.cm, "sq");
      const labelLines = wrap(m.label?.sq ?? m.id, sans, 10, rw - 60);
      const rowH = 16 + labelLines.length * 12;
      labelLines.forEach((l, i) => page.drawText(l, { x: rx, y: ry - 16 - i * 12, size: 10, font: sans, color: INK }));
      page.drawText(value, { x: rx + rw - sans.widthOfTextAtSize(value, 12), y: ry - 16, size: 12, font: sans, color: INK });
      ry -= rowH;
      page.drawLine({ start: { x: rx, y: ry }, end: { x: rx + rw, y: ry }, thickness: 0.5, color: RULE });
    }

    ry -= 24;
    tracked(page, "SHËNIME", rx, ry, 8, sans, 1.2);
    ry -= 10;
    const notes = [item.notes, order.customerNote].filter(Boolean).join("\n\n");
    const noteLines = notes ? wrap(notes, sans, 10, rw - 20) : [];
    const boxH = Math.max(72, noteLines.length * 13 + 20);
    page.drawRectangle({ x: rx, y: ry - boxH, width: rw, height: boxH, borderColor: RULE, borderWidth: 0.8 });
    noteLines.forEach((l, i) => page.drawText(l, { x: rx + 10, y: ry - 18 - i * 13, size: 10, font: sans, color: INK }));
  }

  if (items.length === 0) {
    const page = doc.addPage([A4.w, A4.h]);
    page.drawText("Kjo porosi nuk ka fustane me masa.", { x: M, y: A4.h - M - 20, size: 11, font: fonts.sans, color: INK });
  }
  return doc.save();
}

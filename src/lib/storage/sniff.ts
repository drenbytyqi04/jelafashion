/** Identify a file by its first bytes, never by its name or the browser's claimed type. */
export function sniffFile(bytes: Uint8Array): { contentType: string; extension: string } | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (starts(0xff, 0xd8, 0xff)) return { contentType: "image/jpeg", extension: "jpg" };
  if (starts(0x89, 0x50, 0x4e, 0x47)) return { contentType: "image/png", extension: "png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { contentType: "image/webp", extension: "webp" };
  if (ascii(4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(8, 12))) return { contentType: "image/avif", extension: "avif" };
  if (ascii(4, 8) === "ftyp") return { contentType: "video/mp4", extension: "mp4" };
  if (starts(0x1a, 0x45, 0xdf, 0xa3)) return { contentType: "video/webm", extension: "webm" };
  if (starts(0x25, 0x50, 0x44, 0x46)) return { contentType: "application/pdf", extension: "pdf" };
  return null;
}

export const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};

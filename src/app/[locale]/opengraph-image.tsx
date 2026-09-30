import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Shared preview for links to the site (Instagram, WhatsApp, Facebook): the wordmark on
// ivory with a single champagne line. Dresses with photos use their own image instead.

export const alt = "Jela Fashion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const COPY = {
  sq: { line: "Fustane nusërie dhe mbrëmjeje", meta: "Punuar me dorë në Prizren · Sipas masave · Dërgesa në mbarë botën" },
  en: { line: "Bridal and evening dresses", meta: "Handmade in Prizren · Made to measure · Worldwide shipping" },
} as const;

export function generateStaticParams() {
  return [{ locale: "sq" }, { locale: "en" }];
}

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const copy = COPY[locale === "en" ? "en" : "sq"];
  const [serif, sans] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/CormorantGaramond-Light.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Manrope-Medium.ttf")),
  ]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAF7F2", color: "#1C1917" }}>
        <div style={{ fontFamily: "Cormorant", fontSize: 92, letterSpacing: "0.32em", marginRight: "-0.32em" }}>JELA FASHION</div>
        <div style={{ width: 120, height: 1, background: "#C9A86A", marginTop: 36, marginBottom: 36 }} />
        <div style={{ fontFamily: "Cormorant", fontSize: 44 }}>{copy.line}</div>
        <div style={{ fontFamily: "Manrope", fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6B645C", marginTop: 28 }}>{copy.meta}</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Cormorant", data: serif, style: "normal", weight: 300 },
        { name: "Manrope", data: sans, style: "normal", weight: 500 },
      ],
    },
  );
}

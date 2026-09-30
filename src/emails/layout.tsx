import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";

// Email clients ignore most CSS, so the brand is carried by inline styles: ivory ground,
// near-black serif headings, one champagne hairline. Web fonts are unreliable in email, so
// headings fall back to Georgia wherever Cormorant Garamond isn't installed.

export const colors = {
  ivory: "#FAF7F2",
  linen: "#F2ECE3",
  ink: "#1C1917",
  stone: "#6B645C",
  champagne: "#C9A86A",
  hairline: "#E2D9CC",
};

const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const sans = "Manrope, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const s = {
  heading: { fontFamily: serif, fontWeight: 300, fontSize: "32px", lineHeight: "38px", color: colors.ink, margin: "0 0 16px" },
  h2: { fontFamily: serif, fontWeight: 400, fontSize: "22px", lineHeight: "28px", color: colors.ink, margin: "0 0 12px" },
  text: { fontFamily: sans, fontSize: "15px", lineHeight: "24px", color: colors.ink, margin: "0 0 12px" },
  small: { fontFamily: sans, fontSize: "13px", lineHeight: "20px", color: colors.stone, margin: "0" },
  label: { fontFamily: sans, fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: colors.stone, margin: "0 0 8px" },
  hr: { borderColor: colors.hairline, borderTopWidth: "1px", margin: "28px 0" },
  button: {
    display: "inline-block",
    backgroundColor: colors.champagne,
    color: colors.ink,
    fontFamily: sans,
    fontSize: "12px",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    textDecoration: "none",
    padding: "16px 28px",
  },
} satisfies Record<string, CSSProperties>;

export function EmailLayout({
  lang,
  preview,
  footer,
  help,
  siteUrl,
  children,
}: {
  lang: string;
  preview: string;
  footer: string;
  help?: string;
  siteUrl: string;
  children: ReactNode;
}) {
  return (
    <Html lang={lang}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: colors.ivory, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: "560px", padding: "0 24px" }}>
          <Section style={{ textAlign: "center", paddingBottom: "24px" }}>
            <Link
              href={siteUrl}
              style={{ fontFamily: serif, fontSize: "22px", letterSpacing: "0.32em", color: colors.ink, textDecoration: "none" }}
            >
              JELA FASHION
            </Link>
          </Section>
          <Hr style={{ borderColor: colors.champagne, borderTopWidth: "1px", margin: "0 0 32px" }} />
          {children}
          <Hr style={s.hr} />
          {help && <Text style={{ ...s.small, marginBottom: "8px" }}>{help}</Text>}
          <Text style={s.small}>
            {footer} ·{" "}
            <Link href="https://www.instagram.com/jelafashionpz/" style={{ color: colors.stone }}>
              @jelafashionpz
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

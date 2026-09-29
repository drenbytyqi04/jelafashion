import Link from "next/link";

// Reached only for requests the proxy cannot assign a locale to.
export default function GlobalNotFound() {
  return (
    <html lang="sq">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#FAF7F2", color: "#1C1917", padding: "20vh 24px", textAlign: "center" }}>
        <p style={{ letterSpacing: "0.38em", textTransform: "uppercase" }}>Jela Fashion</p>
        <p>Kjo faqe nuk ekziston. / This page does not exist.</p>
        <Link href="/" style={{ color: "#1C1917" }}>Kthehu në ballinë / Back to home</Link>
      </body>
    </html>
  );
}

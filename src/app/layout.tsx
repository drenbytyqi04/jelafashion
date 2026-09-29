import "./globals.css";

// The real <html> lives in app/[locale]/layout.tsx so each locale sets its own `lang`.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

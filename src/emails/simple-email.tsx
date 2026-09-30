import { Button, Section, Text } from "@react-email/components";
import { EmailLayout, s } from "./layout";

/** Newsletter welcome and short shop alerts: a heading, a few paragraphs, one button. */
export function SimpleEmail(p: {
  lang: string;
  preview: string;
  label?: string;
  heading: string;
  paragraphs: string[];
  cta?: { label: string; href: string };
  footer: string;
  siteUrl: string;
}) {
  return (
    <EmailLayout lang={p.lang} preview={p.preview} footer={p.footer} siteUrl={p.siteUrl}>
      {p.label && <Text style={s.label}>{p.label}</Text>}
      <Text style={s.heading}>{p.heading}</Text>
      {p.paragraphs.map((line, i) => (
        <Text key={i} style={s.text}>
          {line}
        </Text>
      ))}
      {p.cta && (
        <Section style={{ marginTop: "24px" }}>
          <Button href={p.cta.href} style={s.button}>
            {p.cta.label}
          </Button>
        </Section>
      )}
    </EmailLayout>
  );
}

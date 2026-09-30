import { Button, Column, Row, Section, Text } from "@react-email/components";
import { EmailLayout, colors, s } from "./layout";

// One template for every customer-facing order email: confirmation, payment received and
// status updates differ only in the copy and which blocks are present. All strings arrive
// already translated, so the template has no locale logic.

export type EmailLine = {
  name: string;
  meta: string;
  price: string;
  measurements?: { label: string; value: string }[];
  measurementsTitle?: string;
  notes?: string;
};

export type EmailDetail = { label: string; value: string };

export type OrderEmailProps = {
  lang: string;
  preview: string;
  heading: string;
  intro: string[];
  orderLabel: string;
  cta?: { label: string; href: string };
  /** Offline payment instructions (bank, agency, Wise). */
  instructions?: { title: string; intro: string; details: EmailDetail[]; after: string; upload?: { label: string; href: string } };
  items?: { title: string; lines: EmailLine[]; totals: EmailDetail[]; total: EmailDetail };
  address?: { title: string; lines: string[] };
  footer: string;
  help: string;
  siteUrl: string;
};

export function OrderEmail(p: OrderEmailProps) {
  return (
    <EmailLayout lang={p.lang} preview={p.preview} footer={p.footer} help={p.help} siteUrl={p.siteUrl}>
      <Text style={s.label}>{p.orderLabel}</Text>
      <Text style={s.heading}>{p.heading}</Text>
      {p.intro.map((line) => (
        <Text key={line} style={s.text}>
          {line}
        </Text>
      ))}
      {p.cta && (
        <Section style={{ margin: "24px 0 8px" }}>
          <Button href={p.cta.href} style={s.button}>
            {p.cta.label}
          </Button>
        </Section>
      )}

      {p.instructions && (
        <Section style={{ backgroundColor: colors.linen, padding: "24px", margin: "28px 0 0" }}>
          <Text style={s.h2}>{p.instructions.title}</Text>
          <Text style={s.text}>{p.instructions.intro}</Text>
          {p.instructions.details.map((d) => (
            <Row key={d.label} style={{ borderTop: `1px solid ${colors.hairline}` }}>
              <Column style={{ ...s.small, padding: "10px 0", width: "40%", verticalAlign: "top" }}>{d.label}</Column>
              <Column style={{ ...s.text, margin: 0, padding: "10px 0", fontFamily: "Menlo, Consolas, monospace", fontSize: "14px" }}>
                {d.value}
              </Column>
            </Row>
          ))}
          <Text style={{ ...s.small, marginTop: "12px" }}>{p.instructions.after}</Text>
          {p.instructions.upload && (
            <Section style={{ marginTop: "20px" }}>
              <Button href={p.instructions.upload.href} style={s.button}>
                {p.instructions.upload.label}
              </Button>
            </Section>
          )}
        </Section>
      )}

      {p.items && (
        <Section style={{ marginTop: "32px" }}>
          <Text style={s.label}>{p.items.title}</Text>
          {p.items.lines.map((l, i) => (
            <Section key={i} style={{ borderTop: `1px solid ${colors.hairline}`, padding: "16px 0" }}>
              <Row>
                <Column style={{ verticalAlign: "top" }}>
                  <Text style={{ ...s.h2, fontSize: "20px", margin: 0 }}>{l.name}</Text>
                  <Text style={s.small}>{l.meta}</Text>
                </Column>
                <Column style={{ ...s.text, margin: 0, textAlign: "right", verticalAlign: "top", width: "120px" }}>{l.price}</Column>
              </Row>
              {l.measurements && (
                <Section style={{ borderLeft: `1px solid ${colors.champagne}`, paddingLeft: "12px", marginTop: "10px" }}>
                  {l.measurementsTitle && <Text style={{ ...s.small, color: colors.ink, marginBottom: "4px" }}>{l.measurementsTitle}</Text>}
                  {l.measurements.map((m) => (
                    <Row key={m.label}>
                      <Column style={{ ...s.small, padding: "2px 0" }}>{m.label}</Column>
                      <Column style={{ ...s.small, color: colors.ink, textAlign: "right", padding: "2px 0" }}>{m.value}</Column>
                    </Row>
                  ))}
                  {l.notes && <Text style={{ ...s.small, marginTop: "6px" }}>{l.notes}</Text>}
                </Section>
              )}
            </Section>
          ))}
          <Section style={{ borderTop: `1px solid ${colors.hairline}`, paddingTop: "12px" }}>
            {p.items.totals.map((d) => (
              <Row key={d.label}>
                <Column style={{ ...s.small, padding: "3px 0" }}>{d.label}</Column>
                <Column style={{ ...s.small, color: colors.ink, textAlign: "right", padding: "3px 0" }}>{d.value}</Column>
              </Row>
            ))}
            <Row>
              <Column style={{ ...s.text, margin: 0, paddingTop: "8px" }}>{p.items.total.label}</Column>
              <Column style={{ ...s.h2, margin: 0, paddingTop: "8px", textAlign: "right" }}>{p.items.total.value}</Column>
            </Row>
          </Section>
        </Section>
      )}

      {p.address && (
        <Section style={{ marginTop: "28px" }}>
          <Text style={s.label}>{p.address.title}</Text>
          {p.address.lines.map((line) => (
            <Text key={line} style={{ ...s.text, margin: 0 }}>
              {line}
            </Text>
          ))}
        </Section>
      )}
    </EmailLayout>
  );
}

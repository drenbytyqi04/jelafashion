import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { Resend } from "resend";
import { localDataEnabled } from "@/lib/local-db";

let resend: Resend | null | undefined;
const client = () => (resend !== undefined ? resend : (resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null));

export type Email = { to: string; subject: string; react: ReactElement; replyTo?: string; tag: string };

/**
 * Sends through Resend. Without RESEND_API_KEY (local development) the rendered HTML goes
 * to .data/emails/ instead, so every email can be opened and checked in a browser.
 * Never throws: a failed email must not undo an order that is already stored.
 */
export async function sendEmail({ to, subject, react, replyTo, tag }: Email): Promise<boolean> {
  try {
    const html = await render(react);
    const text = await render(react, { plainText: true });
    const resendClient = client();
    if (!resendClient) {
      if (!localDataEnabled()) {
        console.warn(`[email] RESEND_API_KEY missing; "${subject}" to ${to} not sent`);
        return false;
      }
      const dir = path.join(process.cwd(), ".data", "emails");
      await mkdir(dir, { recursive: true });
      const file = path.join(dir, `${new Date().toISOString().replace(/[:.]/g, "-")}-${tag}.html`);
      await writeFile(file, `<!-- To: ${to}\n     Subject: ${subject} -->\n${html}`);
      console.info(`[email] ${tag} → ${to} (dev outbox: ${path.relative(process.cwd(), file)})`);
      return true;
    }
    const from = process.env.EMAIL_FROM ?? "Jela Fashion <onboarding@resend.dev>";
    const { error } = await resendClient.emails.send({ from, to, subject, html, text, replyTo, tags: [{ name: "type", value: tag }] });
    if (error) {
      console.error(`[email] ${tag} to ${to} failed: ${error.message}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email] ${tag} to ${to} failed`, err);
    return false;
  }
}

/** Where shop alerts go; falls back to the public contact address. */
export const shopInbox = () => process.env.SHOP_NOTIFICATION_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL || null;

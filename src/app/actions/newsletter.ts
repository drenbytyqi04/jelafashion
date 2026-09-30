"use server";

import { after } from "next/server";
import { getLocale } from "next-intl/server";
import type { Locale } from "@/lib/catalog/types";
import { sendNewsletterWelcome } from "@/lib/email/notifications";
import { siteOrigin } from "@/lib/site-origin";
import { publicSupabase } from "@/lib/supabase/public-client";
import { serviceSupabase } from "@/lib/supabase/service-client";
import { newsletterSchema } from "@/lib/validation/newsletter";

export type NewsletterResult = { ok: true } | { ok: false; field?: "email"; error: string };

/**
 * Server Actions are public endpoints: validate everything here, never trust the client.
 * The answer never reveals whether an address was already subscribed. The welcome email
 * goes only to new addresses, so the form can't be used to flood someone's inbox.
 */
export async function subscribeToNewsletter(input: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, field: "email", error: parsed.error.issues[0]?.message ?? "email" };
  }
  const email = parsed.data.email.toLowerCase();
  const locale = (await getLocale()) as Locale;
  const origin = await siteOrigin();
  const welcome = () => after(() => sendNewsletterWelcome(email, locale, origin).then(() => undefined));

  const service = serviceSupabase();
  if (service) {
    // Server-side insert tells us whether the address is new; duplicates are left as they are.
    const { data, error } = await service
      .from("newsletter_subscribers")
      .upsert({ email, locale, source: "footer" }, { onConflict: "email", ignoreDuplicates: true })
      .select("email");
    if (error) {
      console.error("[newsletter] subscribe failed", error.message);
      return { ok: false, error: "failure" };
    }
    if (data.length > 0) welcome();
    // An address that unsubscribed earlier and signs up again is active again (no email).
    else await service.from("newsletter_subscribers").update({ unsubscribed_at: null }).eq("email", email);
    return { ok: true };
  }

  const db = publicSupabase();
  if (!db) {
    // Supabase not configured (local preview): accept without storing; the welcome email
    // lands in the dev outbox.
    if (process.env.NODE_ENV !== "production") welcome();
    return { ok: true };
  }
  const { error } = await db.rpc("subscribe_newsletter", { p_email: email, p_locale: locale, p_source: "footer" });
  if (error) {
    console.error("[newsletter] subscribe failed", error.message);
    return { ok: false, error: "failure" };
  }
  return { ok: true };
}

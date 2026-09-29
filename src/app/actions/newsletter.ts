"use server";

import { getLocale } from "next-intl/server";
import { publicSupabase } from "@/lib/supabase/public-client";
import { newsletterSchema } from "@/lib/validation/newsletter";

export type NewsletterResult = { ok: true } | { ok: false; field?: "email"; error: string };

/**
 * Server Actions are public endpoints: validate everything here, never trust the client.
 * Stores through the `subscribe_newsletter` database function, which deduplicates and
 * never reveals whether an address was already subscribed.
 * TODO(phase 4): send the welcome email.
 */
export async function subscribeToNewsletter(input: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, field: "email", error: parsed.error.issues[0]?.message ?? "email" };
  }
  const db = publicSupabase();
  if (!db) {
    // Supabase not configured (local preview): accept without storing.
    return { ok: true };
  }
  const { error } = await db.rpc("subscribe_newsletter", {
    p_email: parsed.data.email,
    p_locale: await getLocale(),
    p_source: "footer",
  });
  if (error) {
    console.error("[newsletter] subscribe failed", error.message);
    return { ok: false, error: "failure" };
  }
  return { ok: true };
}

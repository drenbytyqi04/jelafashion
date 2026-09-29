"use server";

import { newsletterSchema } from "@/lib/validation/newsletter";

export type NewsletterResult = { ok: true } | { ok: false; field?: "email"; error: string };

/**
 * Server Actions are public endpoints: validate everything here, never trust the client.
 * TODO(phase 2): store the subscriber in Supabase; TODO(phase 4): send the welcome email.
 */
export async function subscribeToNewsletter(input: unknown): Promise<NewsletterResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, field: "email", error: parsed.error.issues[0]?.message ?? "email" };
  }
  return { ok: true };
}

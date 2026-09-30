"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createTranslator } from "next-intl";
import { z } from "zod";
import type { Locale } from "@/lib/catalog/types";
import { sendEmail } from "@/lib/email/send";
import { SimpleEmail } from "@/emails/simple-email";
import { createLinkToken, LOCAL_SESSION_COOKIE } from "@/lib/auth/local-session";
import { authMode, safeNext } from "@/lib/auth/viewer";
import { siteOrigin } from "@/lib/site-origin";
import { sessionSupabase } from "@/lib/supabase/server-client";

const requestSchema = z.object({
  email: z.string().trim().min(1, "required").email("email").max(254, "email"),
  next: z.string().max(300).optional(),
  locale: z.enum(["sq", "en"]),
});

export type AuthResult = { ok: true } | { ok: false; error: "email" | "required" | "failure" | "unavailable" };

const callbackUrl = (origin: string, next: string) => `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

/**
 * Passwordless sign-in: a one-time link by email. The answer is the same whether or not
 * the address has an account, so the form can't be used to discover customers.
 */
export async function requestSignInLink(input: unknown): Promise<AuthResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: (parsed.error.issues[0]?.message as "email") ?? "email" };
  const { email, locale } = parsed.data;
  const next = safeNext(parsed.data.next, `/${locale}`);
  const origin = await siteOrigin();
  const mode = authMode();

  if (mode === "supabase") {
    const supabase = await sessionSupabase();
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(origin, next), data: { locale } },
    });
    if (error) {
      console.error("[auth] sign-in link failed", error.message);
      // Rate limits and similar are not the visitor's fault to diagnose.
      return { ok: false, error: "failure" };
    }
    return { ok: true };
  }

  if (mode === "local") {
    const token = await createLinkToken(email);
    const messages = (await import(`../../../messages/${locale}.json`)).default;
    const t = createTranslator({ locale, messages, namespace: "auth.linkEmail" });
    const href = `${callbackUrl(origin, next)}&token=${encodeURIComponent(token)}`;
    await sendEmail({
      to: email,
      subject: t("subject"),
      tag: "sign-in-link",
      react: SimpleEmail({
        lang: locale,
        preview: t("text"),
        heading: t("heading"),
        paragraphs: [t("text")],
        cta: { label: t("cta"), href },
        footer: messages.emails.footer,
        siteUrl: `${origin}/${locale}`,
      }),
    });
    return { ok: true };
  }

  return { ok: false, error: "unavailable" };
}

/** Google sign-in (Supabase only): returns the provider URL for the browser to open. */
export async function googleSignInUrl(input: { next?: string; locale: Locale }): Promise<{ ok: true; url: string } | { ok: false }> {
  if (authMode() !== "supabase") return { ok: false };
  const supabase = await sessionSupabase();
  const origin = await siteOrigin();
  const { data, error } = await supabase!.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(origin, safeNext(input.next, `/${input.locale}`)) },
  });
  if (error || !data.url) {
    console.error("[auth] google sign-in failed", error?.message);
    return { ok: false };
  }
  return { ok: true, url: data.url };
}

export async function signOut(formData: FormData) {
  const locale = formData.get("locale") === "en" ? "en" : "sq";
  if (authMode() === "supabase") {
    const supabase = await sessionSupabase();
    await supabase?.auth.signOut();
  } else {
    (await cookies()).delete(LOCAL_SESSION_COOKIE);
  }
  redirect(safeNext(formData.get("next"), `/${locale}`));
}

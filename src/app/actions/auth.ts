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
import { withinRateLimit } from "@/lib/security/rate-limit";
import { sessionSupabase } from "@/lib/supabase/server-client";
import { serviceSupabase } from "@/lib/supabase/service-client";

const requestSchema = z.object({
  email: z.string().trim().min(1, "required").email("email").max(254, "email"),
  next: z.string().max(300).optional(),
  locale: z.enum(["sq", "en"]),
});

export type AuthResult = { ok: true } | { ok: false; error: "email" | "required" | "failure" | "unavailable" | "rateLimited" };

const callbackUrl = (origin: string, next: string) => `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

/** The sign-in email, in the visitor's language, sent through our own sender (Resend). */
async function sendLinkEmail(email: string, locale: Locale, href: string, origin: string) {
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const t = createTranslator({ locale, messages, namespace: "auth.linkEmail" });
  return sendEmail({
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
}

/**
 * With Resend configured, the link is made with the service key and sent by us: no Supabase
 * email quota (a few per hour on its built-in sender), no dependence on its redirect
 * allow-list, and a token_hash link that works on any device (the PKCE link only works in
 * the browser that asked for it). Null when this path isn't available, so the caller falls
 * back to Supabase's own email.
 */
async function sendOwnSupabaseLink(email: string, locale: Locale, next: string, origin: string): Promise<boolean | null> {
  const admin = serviceSupabase();
  if (!admin || !process.env.RESEND_API_KEY) return null;
  let { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error && /not found|no user/i.test(error.message)) {
    // First sign-in: create the account (email confirmed by the link itself), then link.
    const created = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { locale } });
    if (created.error) {
      console.error("[auth] create user failed", created.error.message);
      return false;
    }
    ({ data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email }));
  }
  const hash = data?.properties?.hashed_token;
  if (error || !hash) {
    console.error("[auth] generate link failed", error?.message);
    return null;
  }
  const href = `${callbackUrl(origin, next)}&token_hash=${encodeURIComponent(hash)}&type=email`;
  return sendLinkEmail(email, locale, href, origin);
}

/**
 * Passwordless sign-in: a one-time link by email. The answer is the same whether or not
 * the address has an account, so the form can't be used to discover customers.
 */
export async function requestSignInLink(input: unknown): Promise<AuthResult> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: (parsed.error.issues[0]?.message as "email") ?? "email" };
  if (!(await withinRateLimit("signInLink"))) return { ok: false, error: "rateLimited" };
  const { email, locale } = parsed.data;
  const next = safeNext(parsed.data.next, `/${locale}`);
  const origin = await siteOrigin();
  const mode = authMode();

  if (mode === "supabase") {
    const own = await sendOwnSupabaseLink(email, locale, next, origin);
    if (own === true) return { ok: true };
    const supabase = await sessionSupabase();
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(origin, next), data: { locale } },
    });
    if (error) {
      console.error("[auth] sign-in link failed", error.message);
      // Supabase's built-in sender allows only a few emails per hour for the whole project.
      if (error.status === 429 || /rate limit/i.test(error.message)) return { ok: false, error: "rateLimited" };
      return { ok: false, error: "failure" };
    }
    return { ok: true };
  }

  if (mode === "local") {
    const token = await createLinkToken(email);
    await sendLinkEmail(email, locale, `${callbackUrl(origin, next)}&token=${encodeURIComponent(token)}`, origin);
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

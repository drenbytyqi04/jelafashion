import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Viewer } from "@/lib/account/types";
import { localDataEnabled } from "@/lib/local-db";
import { sessionSupabase, supabaseAuthConfigured } from "@/lib/supabase/server-client";
import { LOCAL_SESSION_COOKIE, localSessionUser } from "./local-session";

export type AuthMode = "supabase" | "local" | null;

/** Supabase Auth whenever a project is configured; local links in development otherwise. */
export function authMode(): AuthMode {
  if (supabaseAuthConfigured()) return "supabase";
  return localDataEnabled() ? "local" : null;
}

/**
 * The data access layer's single answer to "who is this?". Verified on every call (the
 * Supabase token with the auth server, the local cookie by its signature) and memoised per
 * request. Reads cookies, so any page using it renders on demand.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Always read cookies first: pages that ask "who is this?" must render per request, even
  // in a build where no auth is configured (otherwise they would be prerendered signed out).
  const store = await cookies();
  const mode = authMode();
  if (mode === "supabase") {
    const supabase = await sessionSupabase();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user?.email) return null;
    const { data: profile } = await supabase.from("profiles").select("full_name, phone, locale, role").eq("id", user.id).maybeSingle();
    return {
      id: user.id,
      email: user.email.toLowerCase(),
      fullName: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
      phone: profile?.phone ?? null,
      locale: profile?.locale === "en" ? "en" : "sq",
      role: profile?.role === "admin" ? "admin" : "customer",
    };
  }
  if (mode === "local") {
    const u = await localSessionUser(store.get(LOCAL_SESSION_COOKIE)?.value);
    return u ? { id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, locale: u.locale, role: u.role } : null;
  }
  return null;
});

/** Admin pages and actions: anyone else is sent to the admin sign-in. */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/admin/login");
  if (viewer.role !== "admin") redirect("/admin/login?denied=1");
  return viewer;
}

/** Same check for Server Actions, which should answer instead of redirecting. */
export async function adminOrNull(): Promise<Viewer | null> {
  const viewer = await getViewer();
  return viewer?.role === "admin" ? viewer : null;
}

/** Only relative same-site paths are allowed as post-sign-in destinations. */
export function safeNext(next: unknown, fallback: string) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

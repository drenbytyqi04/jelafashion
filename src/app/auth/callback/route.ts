import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { LOCAL_SESSION_COOKIE, redeemLinkToken, SESSION_TTL_S } from "@/lib/auth/local-session";
import { authMode, safeNext } from "@/lib/auth/viewer";
import { sessionSupabase } from "@/lib/supabase/server-client";

// Lands every sign-in: Supabase magic links (PKCE `code`, or `token_hash` when the email
// template uses it), Google OAuth, and local development links (`token`).

const ACCOUNT_PATH = { sq: "/sq/llogaria", en: "/en/account" };

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"), "/sq");
  const locale = next.startsWith("/en") ? "en" : "sq";
  const failed = () => NextResponse.redirect(new URL(`${ACCOUNT_PATH[locale]}?error=link`, url.origin));
  const mode = authMode();

  if (mode === "supabase") {
    const supabase = await sessionSupabase();
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as EmailOtpType | null;
    const { error } = code
      ? await supabase!.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase!.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("missing code") };
    if (error) {
      console.warn("[auth] callback failed:", error.message);
      return failed();
    }
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (mode === "local") {
    const session = await redeemLinkToken(url.searchParams.get("token") ?? "");
    if (!session) return failed();
    (await cookies()).set(LOCAL_SESSION_COOKIE, session, {
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: SESSION_TTL_S,
    });
    return NextResponse.redirect(new URL(next, url.origin));
  }

  return failed();
}

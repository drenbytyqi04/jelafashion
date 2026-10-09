import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Locale routing for the shop, plus Supabase session refresh. The refresh only runs when
 * the visitor carries a Supabase auth cookie, so anonymous traffic (most of it, from ads)
 * never waits on the auth server. Authorization itself happens in the data access layer.
 */
export default async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  // A sign-in link whose redirect wasn't allowed lands on the Site URL itself (/?code=…):
  // finish it at the callback instead of dropping it on the home page.
  if (pathname === "/" && (searchParams.has("code") || searchParams.has("token_hash"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    if (!url.searchParams.has("next")) url.searchParams.set("next", "/admin");
    return NextResponse.redirect(url);
  }
  // The admin panel (Albanian only) and auth callbacks live outside the locale segment.
  const response = pathname.startsWith("/admin") || pathname.startsWith("/auth") ? NextResponse.next({ request }) : intl(request);

  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!SUPABASE_URL || !SUPABASE_KEY || !hasSession) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });
  // Refreshes an expiring access token and writes the new cookies onto the response.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Everything except API routes, Next internals, Vercel internals and files with an extension.
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

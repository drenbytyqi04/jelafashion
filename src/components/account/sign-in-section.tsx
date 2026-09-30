import { getPathname } from "@/i18n/navigation";
import type { AppPathname } from "@/i18n/routing";
import { authMode, safeNext } from "@/lib/auth/viewer";
import type { Locale } from "@/lib/catalog/types";
import { SignInPanel } from "./sign-in-panel";

/** Shown in place of any account page while signed out; returns to that page after. */
export function SignInSection({
  locale,
  path,
  next,
  linkError,
}: {
  locale: Locale;
  path: Exclude<AppPathname, `${string}[${string}`>;
  /** Explicit destination after sign-in (e.g. back to checkout). */
  next?: string;
  linkError?: boolean;
}) {
  const google = authMode() === "supabase" && process.env.NEXT_PUBLIC_AUTH_GOOGLE === "true";
  return (
    <section className="container-page pb-24 pt-[calc(var(--header-h)+56px)] lg:pb-32 lg:pt-[calc(var(--header-h)+96px)]">
      <SignInPanel next={safeNext(next, getPathname({ locale, href: path }))} google={google} linkError={linkError} />
    </section>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { googleSignInUrl, requestSignInLink } from "@/app/actions/auth";
import type { Locale } from "@/lib/catalog/types";
import { newsletterSchema, type NewsletterInput } from "@/lib/validation/newsletter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Passwordless sign-in: email link, plus Google when the project has it enabled. */
export function SignInPanel({
  next,
  google,
  linkError,
  title,
  intro,
  note,
}: {
  /** Where to land after signing in (a localized path). */
  next: string;
  google: boolean;
  linkError?: boolean;
  title?: string;
  intro?: string;
  note?: string | null;
}) {
  const t = useTranslations("auth");
  const tf = useTranslations("forms");
  const locale = useLocale() as Locale;
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(linkError ? t("linkInvalid") : null);
  const [pending, startTransition] = useTransition();
  const [googlePending, startGoogle] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewsletterInput>({ resolver: zodResolver(newsletterSchema), mode: "onTouched" });

  const onSubmit = (values: NewsletterInput) =>
    startTransition(async () => {
      setError(null);
      const res = await requestSignInLink({ email: values.email, next, locale });
      if (res.ok) setSentTo(values.email);
      else setError(res.error === "unavailable" ? t("unavailable") : res.error === "failure" ? t("failure") : tf("email"));
    });

  const withGoogle = () =>
    startGoogle(async () => {
      const res = await googleSignInUrl({ next, locale });
      if (res.ok) window.location.assign(res.url);
      else setError(t("failure"));
    });

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="font-serif text-h2 font-light">{title ?? t("title")}</h1>
      <p className="mt-4 text-body text-stone">{intro ?? t("intro")}</p>

      {sentTo ? (
        <div className="mt-10 border-l border-champagne pl-6" role="status">
          <p className="text-body">{t("linkSent", { email: sentTo })}</p>
          <button
            type="button"
            onClick={() => {
              setSentTo(null);
              reset();
            }}
            className="mt-4 flex min-h-11 items-center text-small"
          >
            <span className="link-underline">{t("differentEmail")}</span>
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 flex flex-col gap-6">
            {error && (
              <p role="alert" className="border border-error px-5 py-4 text-small text-error">
                {error}
              </p>
            )}
            <Input
              id="signin-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              label={t("email")}
              error={errors.email?.message ? tf(errors.email.message as "email") : undefined}
              {...register("email")}
            />
            <Button type="submit" loading={pending} className="w-full">
              {t("sendLink")}
            </Button>
          </form>
          {google && (
            <>
              <p className="my-6 flex items-center gap-4 text-small text-stone before:h-px before:flex-1 before:bg-hairline after:h-px after:flex-1 after:bg-hairline">
                {t("or")}
              </p>
              <Button variant="secondary" onClick={withGoogle} loading={googlePending} className="w-full">
                {t("google")}
              </Button>
            </>
          )}
        </>
      )}
      {note !== null && <p className="mt-10 text-small text-stone">{note ?? t("guestNote")}</p>}
    </div>
  );
}

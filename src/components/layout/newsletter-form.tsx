"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { subscribeToNewsletter } from "@/app/actions/newsletter";
import { Link } from "@/i18n/navigation";
import { newsletterSchema, type NewsletterInput } from "@/lib/validation/newsletter";
import { toast } from "@/stores/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const tf = useTranslations("forms");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    // Validate on first blur, then on every change: errors clear as soon as the fix is
    // typed, so the submit button never jumps away from the pointer.
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await subscribeToNewsletter(values);
      if (!result.ok) {
        setError("email", { message: result.error }, { shouldFocus: true });
        return;
      }
      reset();
      toast({ title: t("success"), tone: "success" });
    } catch {
      toast({ title: t("failure"), tone: "error" });
    }
  });

  const errorKey = errors.email?.message as "required" | "email" | undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <Input
          label={t("emailLabel")}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={t("placeholder")}
          error={errorKey ? tf(errorKey) : undefined}
          className="md:flex-1"
          {...register("email")}
        />
        <Button type="submit" loading={isSubmitting} className="md:mt-[calc(0.875rem*1.55+0.5rem)]">
          {t("submit")}
        </Button>
      </div>
      <p className="mt-3 text-small text-stone">
        <Link href="/privacy" className="link-underline">
          {t("consent")}
        </Link>
      </p>
    </form>
  );
}

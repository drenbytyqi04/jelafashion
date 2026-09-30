"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { updateProfile } from "@/app/actions/account";
import type { Viewer } from "@/lib/account/types";
import { toast } from "@/stores/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";

const schema = z.object({
  fullName: z.string().trim().max(120, "tooLong"),
  phone: z.string().trim().max(30, "tooLong"),
  locale: z.enum(["sq", "en"]),
});
type Values = z.infer<typeof schema>;

export function ProfileForm({ viewer }: { viewer: Viewer }) {
  const t = useTranslations("account.profile");
  const ta = useTranslations("account");
  const tl = useTranslations("languages");
  const tc = useTranslations("checkout");
  const tcommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { fullName: viewer.fullName ?? "", phone: viewer.phone ?? "", locale: viewer.locale },
  });

  const onSubmit = (v: Values) =>
    startTransition(async () => {
      const res = await updateProfile(v);
      if (!res.ok) return toast({ title: ta("failure"), tone: "error" });
      toast({ title: t("saved"), tone: "success" });
      router.refresh();
    });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-xl flex-col gap-6">
      <p className="text-body text-stone">{t("intro")}</p>
      <Input label={t("fullName")} autoComplete="name" optionalLabel={tcommon("optional")} error={errors.fullName ? tc("errors.tooLong") : undefined} {...register("fullName")} />
      <Input label={t("phone")} type="tel" inputMode="tel" autoComplete="tel" optionalLabel={tcommon("optional")} error={errors.phone ? tc("errors.tooLong") : undefined} {...register("phone")} />
      <Controller
        control={control}
        name="locale"
        render={({ field }) => (
          <RadioGroup
            name="locale"
            legend={t("language")}
            value={field.value}
            onValueChange={field.onChange}
            options={[
              { value: "sq", label: tl("sq") },
              { value: "en", label: tl("en") },
            ]}
          />
        )}
      />
      <Button type="submit" loading={pending} className="self-start">
        {t("save")}
      </Button>
    </form>
  );
}

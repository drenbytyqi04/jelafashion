"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { sendContactMessage } from "@/app/actions/contact";
import { CONTACT_TOPICS, contactSchema, type ContactInput } from "@/lib/validation/contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm({ topic, dress, dressName }: { topic?: string; dress?: string; dressName?: string | null }) {
  const t = useTranslations("pages.contact");
  const tf = useTranslations("forms");
  const tc = useTranslations("checkout.errors");
  const tcommon = useTranslations("common");
  const [status, setStatus] = useState<"idle" | "sent" | "failure">("idle");
  const [pending, startTransition] = useTransition();
  const initialTopic = (CONTACT_TOPICS as readonly string[]).includes(topic ?? "") ? (topic as ContactInput["topic"]) : dress ? "sizing" : "general";
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", topic: initialTopic, orderNumber: "", message: "", dress, website: "" },
  });
  const current = useWatch({ control, name: "topic" });
  const err = (m?: string) => (!m ? undefined : m === "required" || m === "email" ? tf(m) : tc("tooLong"));

  const onSubmit = (values: ContactInput) =>
    startTransition(async () => {
      const res = await sendContactMessage(values);
      if (res.ok) {
        setStatus("sent");
        reset({ ...values, message: "", orderNumber: "" });
      } else setStatus("failure");
    });

  if (status === "sent") {
    return (
      <div role="status" className="border-l border-champagne py-2 pl-6">
        <p className="font-serif text-h3">{t("sent")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 md:grid-cols-2">
      {status === "failure" && (
        <p role="alert" className="border border-error px-5 py-4 text-small text-error md:col-span-2">
          {t("failure")}
        </p>
      )}
      {dressName && <p className="text-small text-stone md:col-span-2">{t("dressNote", { name: dressName })}</p>}
      <Input label={t("name")} autoComplete="name" error={err(errors.name?.message)} {...register("name")} />
      <Input label={t("email")} type="email" inputMode="email" autoComplete="email" spellCheck={false} error={err(errors.email?.message)} {...register("email")} />
      <Input label={t("phone")} type="tel" inputMode="tel" autoComplete="tel" optionalLabel={tcommon("optional")} error={err(errors.phone?.message)} {...register("phone")} />
      <Select label={t("topic")} options={CONTACT_TOPICS.map((v) => ({ value: v, label: t(`topics.${v}`) }))} {...register("topic")} />
      {current === "order" && <Input label={t("orderNumber")} placeholder="JF-1001" autoComplete="off" className="md:col-span-2" {...register("orderNumber")} />}
      <Textarea
        label={t("message")}
        rows={6}
        maxLength={3000}
        hint={current === "video" ? t("videoNote") : undefined}
        error={err(errors.message?.message)}
        className="md:col-span-2"
        {...register("message")}
      />
      {/* Honeypot: hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>
      <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center md:justify-between">
        <p className="text-small text-stone">{t("privacyNote")}</p>
        <Button type="submit" loading={pending} magnetic className="w-full md:w-auto">
          {t("submit")}
        </Button>
      </div>
    </form>
  );
}

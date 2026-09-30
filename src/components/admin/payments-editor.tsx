"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { savePaymentMethod } from "@/app/actions/admin-catalog";
import type { AdminPaymentMethod } from "@/lib/admin/catalog-store";
import { toast } from "@/stores/toast";
import { Btn, Field, Panel, TextInput, Toggle } from "./ui";

const TITLES = { paysera: "Kartelë (Paysera)", bank_transfer: "Transfertë bankare", cash_agency: "Agjenci transferi parash", wise: "Wise" } as const;

const FIELDS: Record<AdminPaymentMethod["id"], { key: string; label: string; hint?: string; list?: boolean }[]> = {
  paysera: [],
  bank_transfer: [
    { key: "beneficiary", label: "Përfituesi" },
    { key: "iban", label: "IBAN" },
    { key: "swift", label: "SWIFT / BIC" },
    { key: "bankName", label: "Banka" },
  ],
  cash_agency: [
    { key: "recipient", label: "Marrësi (emri i plotë si në letërnjoftim)" },
    { key: "city", label: "Qyteti" },
    { key: "country", label: "Shteti" },
    { key: "agencies", label: "Agjencitë", hint: "Të ndara me presje.", list: true },
  ],
  wise: [
    { key: "accountHolder", label: "Mbajtësi i llogarisë" },
    { key: "email", label: "Email-i në Wise" },
  ],
};

function MethodForm({ method, payseraConfigured }: { method: AdminPaymentMethod; payseraConfigured: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const details = method.details as Record<string, string | string[] | undefined>;
  const { register, handleSubmit } = useForm<Record<string, string | boolean>>({
    defaultValues: {
      enabled: method.enabled,
      ...Object.fromEntries(FIELDS[method.id].map((f) => [f.key, Array.isArray(details[f.key]) ? (details[f.key] as string[]).join(", ") : ((details[f.key] as string) ?? "")])),
    },
  });

  const onSubmit = (v: Record<string, string | boolean>) =>
    startTransition(async () => {
      const next = Object.fromEntries(
        FIELDS[method.id].map((f) => {
          const raw = String(v[f.key] ?? "").trim();
          return [f.key, f.list ? raw.split(",").map((s) => s.trim()).filter(Boolean) : raw];
        }),
      );
      const res = await savePaymentMethod({ id: method.id, enabled: Boolean(v.enabled), sort: method.sort, details: next });
      if (!res.ok) return toast({ title: res.error, tone: "error" });
      toast({ title: "U ruajt.", tone: "success" });
      router.refresh();
    });

  const placeholders = FIELDS[method.id].some((f) => /^\[.*\]$/.test(String(Array.isArray(details[f.key]) ? "" : (details[f.key] ?? ""))));

  return (
    <Panel title={TITLES[method.id]}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Toggle label="Shfaqet te pagesa" {...register("enabled")} />
        {method.id === "paysera" && (
          <p className={payseraConfigured ? "text-success" : "text-gold-ink"}>
            {payseraConfigured
              ? "Paysera është e lidhur (PAYSERA_PROJECT_ID dhe PAYSERA_SIGN_PASSWORD janë vendosur)."
              : "Paysera nuk është e lidhur: vendos PAYSERA_PROJECT_ID dhe PAYSERA_SIGN_PASSWORD në Vercel. Deri atëherë kartela fshihet nga pagesa në faqen live."}
          </p>
        )}
        {placeholders && <p className="text-gold-ink">Zëvendëso vlerat në kllapa [ ] me të dhënat e vërteta para lansimit.</p>}
        {FIELDS[method.id].length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {FIELDS[method.id].map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint} htmlFor={`${method.id}-${f.key}`}>
                <TextInput id={`${method.id}-${f.key}`} {...register(f.key)} />
              </Field>
            ))}
          </div>
        )}
        <Btn type="submit" variant="primary" loading={pending} className="self-start">
          Ruaj
        </Btn>
      </form>
    </Panel>
  );
}

export function PaymentsEditor({ methods, payseraConfigured }: { methods: AdminPaymentMethod[]; payseraConfigured: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      {methods.map((m) => (
        <MethodForm key={m.id} method={m} payseraConfigured={payseraConfigured} />
      ))}
    </div>
  );
}

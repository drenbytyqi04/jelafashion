"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { deleteMeasurementProfile, saveMeasurementProfile } from "@/app/actions/account";
import type { MeasurementProfile } from "@/lib/account/types";
import type { Locale, MeasurementDefinition } from "@/lib/catalog/types";
import { pick } from "@/lib/catalog/types";
import { formatDate } from "@/lib/format";
import { formatMeasure, parseMeasure, toCm, toUnit, type Unit } from "@/lib/units";
import { toast } from "@/stores/toast";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDelete } from "./confirm-delete";
import { MeasurementsList } from "@/components/checkout/measurements-list";

type FormValues = { name: string; unit: Unit; notes: string; values: Record<string, string> };

export function MeasurementsView({ profiles, definitions }: { profiles: MeasurementProfile[]; definitions: MeasurementDefinition[] }) {
  const t = useTranslations("account.measurements");
  const ta = useTranslations("account");
  const tw = useTranslations("wizard");
  const tf = useTranslations("forms");
  const tcommon = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [editing, setEditing] = useState<MeasurementProfile | "new" | null>(null);
  const [deleting, setDeleting] = useState<MeasurementProfile | null>(null);
  const [pending, startTransition] = useTransition();
  const unitLabel = (u: Unit) => (u === "cm" ? "cm" : locale === "sq" ? "inç" : "in");

  const schema = useMemo(
    () =>
      z
        .object({ name: z.string().trim().min(1, "required").max(60), unit: z.enum(["cm", "in"]), notes: z.string().max(1000), values: z.record(z.string(), z.string()) })
        .superRefine((v, ctx) => {
          for (const d of definitions) {
            const raw = v.values[d.id]?.trim();
            if (!raw) continue;
            const n = parseMeasure(raw);
            if (n == null) {
              ctx.addIssue({ code: "custom", path: ["values", d.id], message: "invalid" });
              continue;
            }
            const cm = toCm(n, v.unit);
            if (cm < d.minCm - 0.05 || cm > d.maxCm + 0.05) ctx.addIssue({ code: "custom", path: ["values", d.id], message: "range" });
          }
        }),
    [definitions],
  );

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onTouched" });
  const unit = useWatch({ control, name: "unit" }) ?? "cm";

  function open(p: MeasurementProfile | "new") {
    const base = p === "new" ? { name: t("defaultName"), unit: "cm" as Unit, notes: "", measurements: {} as Record<string, number> } : { ...p, notes: p.notes ?? "" };
    reset({
      name: base.name,
      unit: base.unit,
      notes: base.notes,
      values: Object.fromEntries(definitions.map((d) => [d.id, base.measurements[d.id] != null ? formatMeasure(toUnit(base.measurements[d.id], base.unit), locale) : ""])),
    });
    setEditing(p);
  }

  const onSubmit = (v: FormValues) =>
    startTransition(async () => {
      const measurements: Record<string, number> = {};
      for (const d of definitions) {
        const n = parseMeasure(v.values[d.id] ?? "");
        if (n != null) measurements[d.id] = Math.round(toCm(n, v.unit) * 10) / 10;
      }
      const res = await saveMeasurementProfile({ id: editing && editing !== "new" ? editing.id : undefined, name: v.name, unit: v.unit, notes: v.notes, measurements });
      if (!res.ok) return toast({ title: ta("failure"), tone: "error" });
      toast({ title: t("saved"), tone: "success" });
      setEditing(null);
      router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      if (!deleting) return;
      const res = await deleteMeasurementProfile(deleting.id);
      setDeleting(null);
      if (!res.ok) return toast({ title: ta("failure"), tone: "error" });
      toast({ title: t("deleted"), tone: "success" });
      router.refresh();
    });

  const fieldError = (id: string) => {
    const m = errors.values?.[id]?.message;
    const d = definitions.find((x) => x.id === id)!;
    if (m === "invalid") return t("invalid");
    if (m === "range")
      return t("range", { min: formatMeasure(toUnit(d.minCm, unit), locale), max: formatMeasure(toUnit(d.maxCm, unit), locale), unit: unitLabel(unit) });
    return undefined;
  };

  const groups = [
    { title: t("required"), defs: definitions.filter((d) => d.alwaysRequired) },
    { title: t("optional"), defs: definitions.filter((d) => !d.alwaysRequired) },
  ];
  const labelled = (p: MeasurementProfile) =>
    definitions.filter((d) => p.measurements[d.id] != null).map((d) => ({ id: d.id, cm: p.measurements[d.id], label: d.label }));

  return (
    <div>
      <p className="text-body text-stone">{t("intro")}</p>
      {profiles.length === 0 ? (
        <p className="mt-8 max-w-xl font-serif text-h3">{t("empty")}</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {profiles.map((p) => (
            <li key={p.id} className="border border-hairline p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h2 className="font-serif text-[1.5rem]">{p.name}</h2>
                <p className="nums text-small text-stone">
                  {t("count", { count: Object.keys(p.measurements).length })} · {t("updated", { date: formatDate(p.updatedAt, locale) })}
                </p>
              </div>
              <details className="mt-3">
                <summary className="flex min-h-11 cursor-pointer items-center text-small">
                  <span className="link-underline">{tw("summaryTitle")}</span>
                </summary>
                <div className="max-w-md pb-2 pt-2">
                  <MeasurementsList measurements={labelled(p)} unit={p.unit} notes={p.notes} />
                </div>
              </details>
              <div className="mt-2 flex gap-6">
                <button type="button" onClick={() => open(p)} className="flex min-h-11 items-center text-small">
                  <span className="link-underline">{t("edit")}</span>
                </button>
                <button type="button" onClick={() => setDeleting(p)} className="flex min-h-11 items-center text-small text-stone hover:text-ink">
                  {t("delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" onClick={() => open("new")} className="mt-8">
        {t("add")}
      </Button>

      <Drawer
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        title={editing === "new" ? t("newTitle") : t("editTitle")}
        footer={
          <Button type="submit" form="measurements-form" loading={pending} className="w-full">
            {t("save")}
          </Button>
        }
      >
        <form id="measurements-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
          <Input label={t("name")} hint={t("nameHint")} maxLength={60} error={errors.name ? tf("required") : undefined} {...register("name")} />
          <Controller
            control={control}
            name="unit"
            render={({ field }) => (
              <RadioGroup
                name="unit"
                legend={t("unit")}
                value={field.value}
                onValueChange={field.onChange}
                options={[
                  { value: "cm", label: tw("unitCm") },
                  { value: "in", label: tw("unitIn") },
                ]}
              />
            )}
          />
          {groups.map((g) => (
            <fieldset key={g.title} className="flex flex-col gap-5 border-t border-hairline pt-6">
              <legend className="label float-left mb-1 w-full text-stone">{g.title}</legend>
              {g.defs.map((d) => (
                <Input
                  key={d.id}
                  label={pick(d.label, locale)}
                  optionalLabel={tcommon("optional")}
                  inputMode="decimal"
                  autoComplete="off"
                  suffix={unitLabel(unit)}
                  error={fieldError(d.id)}
                  {...register(`values.${d.id}`)}
                />
              ))}
            </fieldset>
          ))}
          <Textarea label={t("notes")} optionalLabel={tcommon("optional")} rows={3} maxLength={1000} {...register("notes")} />
        </form>
      </Drawer>

      <ConfirmDelete
        open={deleting !== null}
        onOpenChange={(v) => !v && setDeleting(null)}
        title={t("confirmDelete")}
        confirmLabel={t("delete")}
        onConfirm={onDelete}
        pending={pending}
      />
    </div>
  );
}

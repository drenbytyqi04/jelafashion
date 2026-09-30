"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { deleteDiscount, saveDiscount } from "@/app/actions/admin-catalog";
import type { AdminDiscount } from "@/lib/catalog/admin-types";
import { formatDate, formatPrice } from "@/lib/format";
import { toast } from "@/stores/toast";
import { Drawer } from "@/components/ui/drawer";
import { Btn, Field, SelectInput, Table, TextInput, Toggle } from "./ui";

type Values = { code: string; kind: "percent" | "fixed"; value: string; minSubtotal: string; startsAt: string; expiresAt: string; usageLimit: string; active: boolean };

const dateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const toIso = (d: string, endOfDay = false) => (d ? new Date(`${d}T${endOfDay ? "23:59:59" : "00:00:00"}Z`).toISOString() : null);

function status(d: AdminDiscount) {
  const now = new Date().toISOString();
  if (!d.active) return { label: "Joaktiv", tone: "text-stone" };
  if (d.expiresAt && d.expiresAt <= now) return { label: "Ka skaduar", tone: "text-stone" };
  if (d.usageLimit !== null && d.usedCount >= d.usageLimit) return { label: "I shteruar", tone: "text-stone" };
  if (d.startsAt && d.startsAt > now) return { label: "Planifikuar", tone: "text-gold-ink" };
  return { label: "Aktiv", tone: "text-success" };
}

export function DiscountsEditor({ discounts }: { discounts: AdminDiscount[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminDiscount | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, reset } = useForm<Values>();
  const kind = useWatch({ control, name: "kind" });
  const current = editing && editing !== "new" ? editing : null;

  const open = (d: AdminDiscount | "new") => {
    setError(null);
    const x = d === "new" ? null : d;
    reset({
      code: x?.code ?? "",
      kind: x?.kind ?? "percent",
      value: x ? String(x.kind === "fixed" ? x.value / 100 : x.value) : "10",
      minSubtotal: x ? String(x.minSubtotalCents / 100) : "0",
      startsAt: dateInput(x?.startsAt ?? null),
      expiresAt: dateInput(x?.expiresAt ?? null),
      usageLimit: x?.usageLimit ? String(x.usageLimit) : "",
      active: x?.active ?? true,
    });
    setEditing(d);
  };

  const onSubmit = (v: Values) =>
    startTransition(async () => {
      const num = (s: string) => Number(s.replace(",", "."));
      const res = await saveDiscount({
        id: current?.id,
        code: v.code,
        kind: v.kind,
        value: v.kind === "fixed" ? Math.round(num(v.value) * 100) : Math.round(num(v.value)),
        minSubtotalCents: Math.round((num(v.minSubtotal) || 0) * 100),
        startsAt: toIso(v.startsAt),
        expiresAt: toIso(v.expiresAt, true),
        usageLimit: v.usageLimit ? Math.round(num(v.usageLimit)) : null,
        active: v.active,
      });
      if (!res.ok) return setError(res.error);
      toast({ title: "Kodi u ruajt.", tone: "success" });
      setEditing(null);
      router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      if (!current) return;
      const res = await deleteDiscount(current.id);
      if (!res.ok) return setError(res.error);
      setEditing(null);
      router.refresh();
    });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Btn variant="primary" onClick={() => open("new")}>
          Shto kod
        </Btn>
      </div>
      <Table head={["Kodi", "Zbritja", "Minimumi", "Përdorur", "Skadon", "Statusi"]}>
        {discounts.map((d) => {
          const s = status(d);
          return (
            <tr key={d.id}>
              <td>
                <button type="button" onClick={() => open(d)} className="nums font-medium underline-offset-4 hover:underline">
                  {d.code}
                </button>
              </td>
              <td className="nums">{d.kind === "percent" ? `${d.value}%` : formatPrice(d.value, "sq")}</td>
              <td className="nums">{d.minSubtotalCents ? formatPrice(d.minSubtotalCents, "sq") : "—"}</td>
              <td className="nums">
                {d.usedCount}
                {d.usageLimit !== null && ` / ${d.usageLimit}`}
              </td>
              <td className="nums whitespace-nowrap">{d.expiresAt ? formatDate(d.expiresAt, "sq") : "—"}</td>
              <td className={s.tone}>{s.label}</td>
            </tr>
          );
        })}
      </Table>

      <Drawer
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        title={current ? current.code : "Kod i ri"}
        footer={
          <div className="flex justify-between gap-2">
            {current ? (
              <Btn variant="danger" onClick={onDelete} loading={pending}>
                Fshij
              </Btn>
            ) : (
              <span />
            )}
            <Btn variant="primary" type="submit" form="discount-form" loading={pending}>
              Ruaj
            </Btn>
          </div>
        }
      >
        <form id="discount-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-[0.875rem]">
          {error && (
            <p role="alert" className="rounded-admin border border-error/60 px-3 py-2 text-error">
              {error}
            </p>
          )}
          <Field label="Kodi" htmlFor="dcode" hint="Klientja e shkruan pa marrë parasysh shkronjat e mëdha.">
            <TextInput id="dcode" className="uppercase" {...register("code")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lloji" htmlFor="dkind">
              <SelectInput
                id="dkind"
                options={[
                  { value: "percent", label: "Përqindje" },
                  { value: "fixed", label: "Shumë fikse (EUR)" },
                ]}
                {...register("kind")}
              />
            </Field>
            <Field label={kind === "fixed" ? "Vlera (EUR)" : "Vlera (%)"} htmlFor="dval">
              <TextInput id="dval" inputMode="decimal" {...register("value")} />
            </Field>
          </div>
          <Field label="Porosia minimale (EUR)" htmlFor="dmin">
            <TextInput id="dmin" inputMode="decimal" {...register("minSubtotal")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fillon" htmlFor="dstart">
              <TextInput id="dstart" type="date" {...register("startsAt")} />
            </Field>
            <Field label="Skadon" htmlFor="dend">
              <TextInput id="dend" type="date" {...register("expiresAt")} />
            </Field>
          </div>
          <Field label="Kufiri i përdorimeve" htmlFor="dlimit" hint="Bosh = pa kufi.">
            <TextInput id="dlimit" inputMode="numeric" {...register("usageLimit")} />
          </Field>
          <Toggle label="Aktiv" {...register("active")} />
        </form>
      </Drawer>
    </>
  );
}

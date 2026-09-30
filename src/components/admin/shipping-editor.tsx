"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { deleteZone, saveZone } from "@/app/actions/admin-catalog";
import type { AdminZone } from "@/lib/admin/catalog-store";
import { formatPrice } from "@/lib/format";
import { toast } from "@/stores/toast";
import { Drawer } from "@/components/ui/drawer";
import { Btn, Field, TextArea, TextInput, Toggle } from "./ui";

type Rate = { id?: string; nameSq: string; nameEn: string; price: string; freeOver: string; minDays: string; maxDays: string };
type Values = { nameSq: string; nameEn: string; countries: string; isFallback: boolean; sort: string; rates: Rate[] };

const eur = (s: string) => Math.round(Number(s.replace(",", ".")) * 100);

export function ShippingEditor({ zones, countryNames }: { zones: AdminZone[]; countryNames: Record<string, string> }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminZone | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, reset } = useForm<Values>();
  const rates = useFieldArray({ control, name: "rates" });
  const countries = useWatch({ control, name: "countries" }) ?? "";
  const current = editing && editing !== "new" ? editing : null;
  const codes = countries.toUpperCase().split(/[\s,;]+/).filter(Boolean);
  const unknown = codes.filter((c) => !countryNames[c]);

  const open = (z: AdminZone | "new") => {
    setError(null);
    const x = z === "new" ? null : z;
    reset({
      nameSq: x?.name.sq ?? "",
      nameEn: x?.name.en ?? "",
      countries: x?.countries.join(", ") ?? "",
      isFallback: x?.isFallback ?? false,
      sort: String(x?.sort ?? zones.length + 1),
      rates: (x?.rates ?? [{ id: undefined, name: { sq: "Standarde", en: "Standard" }, priceCents: 0, freeOverCents: null, minDays: 3, maxDays: 7 }]).map((r) => ({
        id: r.id,
        nameSq: r.name.sq,
        nameEn: r.name.en,
        price: String(r.priceCents / 100),
        freeOver: r.freeOverCents ? String(r.freeOverCents / 100) : "",
        minDays: String(r.minDays),
        maxDays: String(r.maxDays),
      })),
    });
    setEditing(z);
  };

  const onSubmit = (v: Values) =>
    startTransition(async () => {
      const res = await saveZone({
        id: current?.id,
        name: { sq: v.nameSq, en: v.nameEn || v.nameSq },
        countries: [...new Set(v.countries.toUpperCase().split(/[\s,;]+/).filter(Boolean))],
        isFallback: v.isFallback,
        sort: Number(v.sort) || 0,
        rates: v.rates.map((r) => ({
          id: r.id,
          name: { sq: r.nameSq, en: r.nameEn || r.nameSq },
          priceCents: eur(r.price) || 0,
          freeOverCents: r.freeOver ? eur(r.freeOver) : null,
          minDays: Number(r.minDays),
          maxDays: Number(r.maxDays),
        })),
      });
      if (!res.ok) return setError(res.error);
      toast({ title: "Zona u ruajt.", tone: "success" });
      setEditing(null);
      router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      if (!current) return;
      const res = await deleteZone(current.id);
      if (!res.ok) return setError(res.error);
      setEditing(null);
      router.refresh();
    });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Btn variant="primary" onClick={() => open("new")}>
          Shto zonë
        </Btn>
      </div>
      <ul className="flex flex-col gap-3">
        {zones.map((z) => (
          <li key={z.id}>
            <button type="button" onClick={() => open(z)} className="block w-full rounded-admin border border-hairline bg-white p-4 text-left hover:border-ink">
              <span className="flex flex-wrap items-baseline justify-between gap-3">
                <span className="font-medium">{z.name.sq}</span>
                <span className="text-[0.75rem] text-stone">{z.isFallback ? "Pjesa tjetër e botës" : `${z.countries.length} shtete`}</span>
              </span>
              {!z.isFallback && <span className="mt-1 block truncate text-[0.8125rem] text-stone">{z.countries.map((c) => countryNames[c] ?? c).join(", ")}</span>}
              <span className="nums mt-2 block text-[0.8125rem]">
                {z.rates.map((r) => `${r.name.sq}: ${r.priceCents ? formatPrice(r.priceCents, "sq") : "Falas"} · ${r.minDays}–${r.maxDays} ditë`).join("   |   ")}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Drawer
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        title={current ? current.name.sq : "Zonë e re"}
        footer={
          <div className="flex justify-between gap-2">
            {current ? (
              <Btn variant="danger" onClick={onDelete} loading={pending}>
                Fshij
              </Btn>
            ) : (
              <span />
            )}
            <Btn variant="primary" type="submit" form="zone-form" loading={pending}>
              Ruaj
            </Btn>
          </div>
        }
      >
        <form id="zone-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-[0.875rem]">
          {error && (
            <p role="alert" className="rounded-admin border border-error/60 px-3 py-2 text-error">
              {error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Emri (shqip)" htmlFor="zsq">
              <TextInput id="zsq" {...register("nameSq")} />
            </Field>
            <Field label="Emri (anglisht)" htmlFor="zen">
              <TextInput id="zen" {...register("nameEn")} />
            </Field>
          </div>
          <Toggle label="Zona për pjesën tjetër të botës (çdo shtet që s'është në zonat e tjera)" {...register("isFallback")} />
          <Field
            label="Shtetet (kodet ISO)"
            htmlFor="zcountries"
            hint={unknown.length ? undefined : codes.map((c) => countryNames[c]).join(", ") || "P.sh. XK, AL, MK"}
            error={unknown.length ? `Kode të panjohura: ${unknown.join(", ")}` : undefined}
          >
            <TextArea id="zcountries" className="nums uppercase" {...register("countries")} />
          </Field>
          <Field label="Renditja" htmlFor="zsort" className="w-24">
            <TextInput id="zsort" inputMode="numeric" {...register("sort")} />
          </Field>
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1.5 text-[0.8125rem] font-medium">Tarifat</legend>
            {rates.fields.map((f, i) => (
              <div key={f.id} className="rounded-admin border border-hairline p-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Emri (shqip)" htmlFor={`r${i}sq`}>
                    <TextInput id={`r${i}sq`} {...register(`rates.${i}.nameSq`)} />
                  </Field>
                  <Field label="Emri (anglisht)" htmlFor={`r${i}en`}>
                    <TextInput id={`r${i}en`} {...register(`rates.${i}.nameEn`)} />
                  </Field>
                  <Field label="Çmimi (EUR)" htmlFor={`r${i}p`}>
                    <TextInput id={`r${i}p`} inputMode="decimal" {...register(`rates.${i}.price`)} />
                  </Field>
                  <Field label="Falas mbi (EUR)" htmlFor={`r${i}f`} hint="Bosh = asnjëherë.">
                    <TextInput id={`r${i}f`} inputMode="decimal" {...register(`rates.${i}.freeOver`)} />
                  </Field>
                  <Field label="Ditë pune (min)" htmlFor={`r${i}min`}>
                    <TextInput id={`r${i}min`} inputMode="numeric" {...register(`rates.${i}.minDays`)} />
                  </Field>
                  <Field label="Ditë pune (max)" htmlFor={`r${i}max`}>
                    <TextInput id={`r${i}max`} inputMode="numeric" {...register(`rates.${i}.maxDays`)} />
                  </Field>
                </div>
                {rates.fields.length > 1 && (
                  <Btn variant="ghost" size="sm" className="mt-2" onClick={() => rates.remove(i)}>
                    <Trash2 aria-hidden size={14} strokeWidth={1.5} /> Hiq tarifën
                  </Btn>
                )}
              </div>
            ))}
            <Btn size="sm" className="self-start" onClick={() => rates.append({ nameSq: "", nameEn: "", price: "", freeOver: "", minDays: "3", maxDays: "7" })}>
              Shto tarifë
            </Btn>
          </fieldset>
        </form>
      </Drawer>
    </>
  );
}

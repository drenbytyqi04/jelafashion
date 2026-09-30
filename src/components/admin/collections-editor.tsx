"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { deleteCollection, saveCollection } from "@/app/actions/admin-catalog";
import type { AdminCollection } from "@/lib/catalog/admin-types";
import { toast } from "@/stores/toast";
import { Drawer } from "@/components/ui/drawer";
import { Btn, Field, TextArea, TextInput, Toggle } from "./ui";

type Values = { slug: string; nameSq: string; nameEn: string; descSq: string; descEn: string; published: boolean; sort: string; productIds: string[] };
const toValues = (c: AdminCollection | null, sort: number): Values => ({
  slug: c?.slug ?? "",
  nameSq: c?.name.sq ?? "",
  nameEn: c?.name.en ?? "",
  descSq: c?.description.sq ?? "",
  descEn: c?.description.en ?? "",
  published: c?.published ?? true,
  sort: String(c?.sort ?? sort),
  productIds: c?.productIds ?? [],
});

export function CollectionsEditor({ collections, products }: { collections: AdminCollection[]; products: { id: string; name: string; published: boolean }[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminCollection | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, control, handleSubmit, reset } = useForm<Values>();
  const names = new Map(products.map((p) => [p.id, p.name]));

  const open = (c: AdminCollection | "new") => {
    setError(null);
    reset(toValues(c === "new" ? null : c, collections.length + 1));
    setEditing(c);
  };
  const current = editing && editing !== "new" ? editing : null;

  const onSubmit = (v: Values) =>
    startTransition(async () => {
      const res = await saveCollection({
        id: current?.id,
        slug: v.slug,
        name: { sq: v.nameSq, en: v.nameEn || v.nameSq },
        description: { sq: v.descSq, en: v.descEn },
        published: v.published,
        sort: Number(v.sort) || 0,
        productIds: v.productIds,
      });
      if (!res.ok) return setError(res.error);
      toast({ title: "Koleksioni u ruajt.", tone: "success" });
      setEditing(null);
      router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      if (!current) return;
      const res = await deleteCollection(current.id);
      if (!res.ok) return setError(res.error);
      toast({ title: "Koleksioni u fshi.", tone: "success" });
      setEditing(null);
      router.refresh();
    });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Btn variant="primary" onClick={() => open("new")}>
          Shto koleksion
        </Btn>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {collections.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => open(c)} className="block w-full rounded-admin border border-hairline bg-white p-4 text-left hover:border-ink">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{c.name.sq}</span>
                <span className={c.published ? "text-[0.75rem] text-success" : "text-[0.75rem] text-stone"}>{c.published ? "Publikuar" : "Draft"}</span>
              </span>
              <span className="mt-1 block text-[0.75rem] text-stone">
                /{c.slug} · {c.productIds.length} produkte
              </span>
              <span className="mt-2 block truncate text-[0.8125rem] text-stone">{c.productIds.map((id) => names.get(id) ?? "?").join(", ")}</span>
            </button>
          </li>
        ))}
      </ul>

      <Drawer
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        title={current ? current.name.sq : "Koleksion i ri"}
        footer={
          <div className="flex justify-between gap-2">
            {current ? (
              <Btn variant="danger" onClick={onDelete} loading={pending}>
                Fshij
              </Btn>
            ) : (
              <span />
            )}
            <Btn variant="primary" type="submit" form="collection-form" loading={pending}>
              Ruaj
            </Btn>
          </div>
        }
      >
        <form id="collection-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 text-[0.875rem]">
          {error && (
            <p role="alert" className="rounded-admin border border-error/60 px-3 py-2 text-error">
              {error}
            </p>
          )}
          <Field label="Emri (shqip)" htmlFor="colSq">
            <TextInput id="colSq" {...register("nameSq")} />
          </Field>
          <Field label="Emri (anglisht)" htmlFor="colEn">
            <TextInput id="colEn" {...register("nameEn")} />
          </Field>
          <Field label="Slug" htmlFor="colSlug">
            <TextInput id="colSlug" {...register("slug")} />
          </Field>
          <Field label="Përshkrimi (shqip)" htmlFor="colDSq">
            <TextArea id="colDSq" {...register("descSq")} />
          </Field>
          <Field label="Përshkrimi (anglisht)" htmlFor="colDEn">
            <TextArea id="colDEn" {...register("descEn")} />
          </Field>
          <div className="flex items-end gap-4">
            <Field label="Renditja" htmlFor="colSort" className="w-24">
              <TextInput id="colSort" inputMode="numeric" {...register("sort")} />
            </Field>
            <Toggle label="Publikuar" {...register("published")} />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[0.8125rem] font-medium">Produktet</legend>
            <Controller
              control={control}
              name="productIds"
              render={({ field }) => (
                <div className="flex flex-col">
                  {products.map((p) => (
                    <Toggle
                      key={p.id}
                      label={
                        <span>
                          {p.name}
                          {!p.published && <span className="ml-2 text-[0.75rem] text-stone">draft</span>}
                        </span>
                      }
                      checked={field.value?.includes(p.id) ?? false}
                      onChange={(e) => field.onChange(e.target.checked ? [...(field.value ?? []), p.id] : (field.value ?? []).filter((x) => x !== p.id))}
                    />
                  ))}
                </div>
              )}
            />
          </fieldset>
        </form>
      </Drawer>
    </>
  );
}

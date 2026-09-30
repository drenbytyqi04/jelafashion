"use client";

import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { deleteProduct, saveProduct } from "@/app/actions/admin-catalog";
import type { AdminProduct } from "@/lib/catalog/admin-types";
import type { MeasurementDefinition } from "@/lib/catalog/types";
import { SIZES } from "@/lib/catalog/types";
import { cn } from "@/lib/cn";
import { toast } from "@/stores/toast";
import { Modal } from "@/components/ui/modal";
import { Btn, Field, Panel, SelectInput, TextArea, TextInput, Toggle } from "./ui";
import { imageSize, uploadAdminMedia } from "./upload";

type Img = { id: string; path: string; url: string; altSq: string; altEn: string; width: number | null; height: number | null; colorId: string };
type Values = {
  nameSq: string;
  nameEn: string;
  slug: string;
  category: AdminProduct["category"];
  price: string;
  availability: AdminProduct["availability"];
  productionWeeks: string;
  published: boolean;
  featured: boolean;
  descriptionSq: string;
  descriptionEn: string;
  fabricSq: string;
  fabricEn: string;
  length: AdminProduct["length"];
  sleeves: AdminProduct["sleeves"];
  silhouette: string;
  colors: { id: string; nameSq: string; nameEn: string; hex: string; family: string }[];
  images: Img[];
  sizes: Record<string, { offered: boolean; stock: string }>;
  measurements: string[];
  seoTitleSq: string;
  seoTitleEn: string;
  seoDescSq: string;
  seoDescEn: string;
};

const FAMILIES = ["ivory", "white", "champagne", "blush", "black", "red", "silver", "green", "blue"] as const;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function toValues(p: AdminProduct | null): Values {
  return {
    nameSq: p?.name.sq ?? "",
    nameEn: p?.name.en ?? "",
    slug: p?.slug ?? "",
    category: p?.category ?? "bridal",
    price: p ? String(p.priceCents / 100) : "",
    availability: p?.availability ?? "made_to_order",
    productionWeeks: p?.productionWeeks ? String(p.productionWeeks) : "8",
    published: p?.published ?? false,
    featured: p?.featured ?? false,
    descriptionSq: p?.description.sq ?? "",
    descriptionEn: p?.description.en ?? "",
    fabricSq: p?.fabricCare.sq ?? "",
    fabricEn: p?.fabricCare.en ?? "",
    length: p?.length ?? "floor",
    sleeves: p?.sleeves ?? "sleeveless",
    silhouette: p?.silhouette ?? "",
    colors: (p?.colors ?? []).map((c) => ({ id: c.id, nameSq: c.name.sq, nameEn: c.name.en, hex: c.hex, family: c.family })),
    images: (p?.images ?? []).map((i) => ({ id: i.id, path: i.path, url: i.url ?? "", altSq: i.alt.sq, altEn: i.alt.en, width: i.width, height: i.height, colorId: i.colorId ?? "" })),
    sizes: Object.fromEntries(SIZES.map((s) => {
      const found = p?.sizes.find((x) => x.size === s);
      return [s, { offered: p ? Boolean(found) : true, stock: String(found?.stock ?? 0) }];
    })),
    measurements: p?.measurements ?? [],
    seoTitleSq: p?.seoTitle.sq ?? "",
    seoTitleEn: p?.seoTitle.en ?? "",
    seoDescSq: p?.seoDescription.sq ?? "",
    seoDescEn: p?.seoDescription.en ?? "",
  };
}

export function ProductForm({ product, definitions }: { product: AdminProduct | null; definitions: MeasurementDefinition[] }) {
  const tc = useTranslations("collection");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, control, handleSubmit, setValue, getValues } = useForm<Values>({ defaultValues: toValues(product) });
  const colors = useFieldArray({ control, name: "colors" });
  const images = useFieldArray({ control, name: "images" });
  const availability = useWatch({ control, name: "availability" });
  const colorValues = useWatch({ control, name: "colors" });
  const seo = useWatch({ control, name: ["seoTitleSq", "seoTitleEn", "seoDescSq", "seoDescEn"] });

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const [size, uploaded] = await Promise.all([imageSize(file), uploadAdminMedia(file, "product-images", product?.id ?? "new")]);
        images.append({ id: crypto.randomUUID(), path: uploaded.path, url: uploaded.url, altSq: getValues("nameSq"), altEn: getValues("nameEn"), width: size?.width ?? null, height: size?.height ?? null, colorId: "" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ngarkimi dështoi.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const onSubmit = (v: Values) =>
    startTransition(async () => {
      setError(null);
      const price = Number(v.price.replace(",", "."));
      const res = await saveProduct({
        id: product?.id,
        slug: v.slug,
        category: v.category,
        name: { sq: v.nameSq, en: v.nameEn || v.nameSq },
        description: { sq: v.descriptionSq, en: v.descriptionEn },
        fabricCare: { sq: v.fabricSq, en: v.fabricEn },
        priceCents: Number.isFinite(price) ? Math.round(price * 100) : 0,
        availability: v.availability,
        productionWeeks: v.availability === "made_to_order" ? Number(v.productionWeeks) || null : v.productionWeeks ? Number(v.productionWeeks) || null : null,
        length: v.length,
        sleeves: v.sleeves,
        silhouette: v.silhouette.trim() || null,
        featured: v.featured,
        published: v.published,
        seoTitle: { sq: v.seoTitleSq, en: v.seoTitleEn },
        seoDescription: { sq: v.seoDescSq, en: v.seoDescEn },
        colors: v.colors.map((c) => ({ id: c.id, name: { sq: c.nameSq, en: c.nameEn || c.nameSq }, hex: c.hex, family: c.family })),
        images: v.images.map((i) => ({ id: i.id, path: i.path, alt: { sq: i.altSq, en: i.altEn }, width: i.width, height: i.height, colorId: i.colorId || null })),
        sizes: SIZES.filter((s) => v.sizes[s]?.offered).map((s) => ({ size: s, stock: Math.max(0, Math.floor(Number(v.sizes[s].stock) || 0)) })),
        measurements: v.measurements,
      });
      if (!res.ok) {
        setError(res.error);
        window.scrollTo({ top: 0 });
        return;
      }
      toast({ title: "Produkti u ruajt.", tone: "success" });
      if (!product) router.replace(`/admin/products/${res.data.id}`);
      else router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      if (!product) return;
      const res = await deleteProduct(product.id);
      if (!res.ok) return setError(res.error);
      toast({ title: "Produkti u fshi.", tone: "success" });
      router.replace("/admin/products");
    });

  const conditional = definitions.filter((d) => !d.alwaysRequired);
  const always = definitions.filter((d) => d.alwaysRequired);
  const count = (s: string, max: number) => (
    <span className={cn("nums", s.length > max ? "text-error" : "text-stone")}>
      {s.length}/{max}
    </span>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6 pb-24">
      {error && (
        <p role="alert" className="rounded-admin border border-error/60 bg-white px-4 py-3 text-error">
          {error}
        </p>
      )}

      <Panel title="Bazat">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Emri (shqip)" htmlFor="nameSq">
            <TextInput
              id="nameSq"
              required
              {...register("nameSq", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value));
                },
              })}
            />
          </Field>
          <Field label="Emri (anglisht)" htmlFor="nameEn" hint="Bosh = si në shqip.">
            <TextInput id="nameEn" {...register("nameEn")} />
          </Field>
          <Field label="Slug (adresa)" htmlFor="slug" hint="Shfaqet në URL: /fustan/slug">
            <TextInput id="slug" {...register("slug", { onChange: () => setSlugTouched(true) })} />
          </Field>
          <Field label="Kategoria" htmlFor="category">
            <SelectInput id="category" options={(["bridal", "evening", "short"] as const).map((c) => ({ value: c, label: tc(`category.${c}`) }))} {...register("category")} />
          </Field>
          <Field label="Çmimi (EUR)" htmlFor="price">
            <TextInput id="price" inputMode="decimal" {...register("price")} />
          </Field>
          <Field label="Disponueshmëria" htmlFor="availability">
            <SelectInput
              id="availability"
              options={[
                { value: "made_to_order", label: "Me porosi" },
                { value: "in_stock", label: "Në stok" },
              ]}
              {...register("availability")}
            />
          </Field>
          {availability === "made_to_order" && (
            <Field label="Javë pune" htmlFor="weeks" hint="Sa javë duhen për ta qepur.">
              <TextInput id="weeks" inputMode="numeric" {...register("productionWeeks")} />
            </Field>
          )}
          <div className="flex flex-wrap items-end gap-6 md:col-span-2">
            <Toggle label="Publikuar (shfaqet në faqe)" {...register("published")} />
            <Toggle label="I veçuar në faqen kryesore" {...register("featured")} />
          </div>
        </div>
      </Panel>

      <Panel title="Përshkrimi">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Përshkrimi (shqip)" htmlFor="dSq">
            <TextArea id="dSq" rows={5} {...register("descriptionSq")} />
          </Field>
          <Field label="Përshkrimi (anglisht)" htmlFor="dEn">
            <TextArea id="dEn" rows={5} {...register("descriptionEn")} />
          </Field>
          <Field label="Pëlhura dhe kujdesi (shqip)" htmlFor="fSq">
            <TextArea id="fSq" {...register("fabricSq")} />
          </Field>
          <Field label="Pëlhura dhe kujdesi (anglisht)" htmlFor="fEn">
            <TextArea id="fEn" {...register("fabricEn")} />
          </Field>
        </div>
      </Panel>

      <Panel title="Detajet për filtrat">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Gjatësia" htmlFor="length">
            <SelectInput id="length" options={(["mini", "knee", "midi", "floor"] as const).map((l) => ({ value: l, label: tc(`length.${l}`) }))} {...register("length")} />
          </Field>
          <Field label="Mëngët" htmlFor="sleeves">
            <SelectInput id="sleeves" options={(["sleeveless", "short", "long"] as const).map((l) => ({ value: l, label: tc(`sleeves.${l}`) }))} {...register("sleeves")} />
          </Field>
          <Field label="Silueta" htmlFor="silhouette" hint="P.sh. A-line, sirenë, drejt.">
            <TextInput id="silhouette" {...register("silhouette")} />
          </Field>
        </div>
      </Panel>

      <Panel
        title="Ngjyrat"
        actions={
          <Btn size="sm" onClick={() => colors.append({ id: crypto.randomUUID(), nameSq: "", nameEn: "", hex: "#F4EDE1", family: "ivory" })}>
            Shto ngjyrë
          </Btn>
        }
      >
        {colors.fields.length === 0 && <p className="text-stone">Pa ngjyra. Shto të paktën një që klientja ta zgjedhë.</p>}
        <ul className="flex flex-col gap-3">
          {colors.fields.map((f, i) => (
            <li key={f.id} className="grid grid-cols-2 items-end gap-3 md:grid-cols-[1fr_1fr_9rem_9rem_auto]">
              <Field label="Emri (shqip)" htmlFor={`c${i}sq`}>
                <TextInput id={`c${i}sq`} {...register(`colors.${i}.nameSq`)} />
              </Field>
              <Field label="Emri (anglisht)" htmlFor={`c${i}en`}>
                <TextInput id={`c${i}en`} {...register(`colors.${i}.nameEn`)} />
              </Field>
              <Field label="Ngjyra" htmlFor={`c${i}hex`}>
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name={`colors.${i}.hex`}
                    render={({ field }) => (
                      <>
                        <input type="color" aria-label="Zgjidh ngjyrën" value={field.value} onChange={field.onChange} className="h-10 w-10 shrink-0 cursor-pointer rounded-admin border border-field bg-white p-1" />
                        <TextInput id={`c${i}hex`} value={field.value} onChange={field.onChange} maxLength={7} className="nums" />
                      </>
                    )}
                  />
                </div>
              </Field>
              <Field label="Familja (filtri)" htmlFor={`c${i}fam`}>
                <SelectInput id={`c${i}fam`} options={FAMILIES.map((fam) => ({ value: fam, label: tc(`color.${fam}`) }))} {...register(`colors.${i}.family`)} />
              </Field>
              <Btn variant="ghost" aria-label={`Hiq ngjyrën ${i + 1}`} onClick={() => colors.remove(i)} className="w-10 px-0">
                <Trash2 aria-hidden size={16} strokeWidth={1.5} />
              </Btn>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Fotot"
        actions={
          <>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" id="product-images" aria-label="Ngarko foto" onChange={(e) => addImages(e.target.files)} />
            <Btn size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden size={16} strokeWidth={1.5} /> Ngarko foto
            </Btn>
          </>
        }
      >
        <p className="mb-3 text-[0.8125rem] text-stone">Portret 3:4, të paktën 1600 px të larta. Foto e parë shfaqet në koleksion; e dyta shfaqet kur kalon miun sipër.</p>
        {images.fields.length === 0 ? (
          <p className="text-stone">Ende pa foto. Deri atëherë shfaqet një ilustrim neutral.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline">
            {images.fields.map((f, i) => (
              <li key={f.id} className="grid grid-cols-[72px_1fr] gap-4 py-3 md:grid-cols-[72px_1fr_1fr_10rem_auto]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt="" className="aspect-[3/4] w-[72px] rounded-[2px] object-cover" />
                <Field label="Përshkrimi i fotos (shqip)" htmlFor={`i${i}sq`} hint="Për lexuesit e ekranit.">
                  <TextInput id={`i${i}sq`} {...register(`images.${i}.altSq`)} />
                </Field>
                <Field label="Përshkrimi (anglisht)" htmlFor={`i${i}en`} className="col-start-2 md:col-start-auto">
                  <TextInput id={`i${i}en`} {...register(`images.${i}.altEn`)} />
                </Field>
                <Field label="Ngjyra" htmlFor={`i${i}c`} className="col-start-2 md:col-start-auto">
                  <SelectInput
                    id={`i${i}c`}
                    options={[{ value: "", label: "Të gjitha" }, ...(colorValues ?? []).map((c) => ({ value: c.id, label: c.nameSq || c.hex }))]}
                    {...register(`images.${i}.colorId`)}
                  />
                </Field>
                <div className="col-start-2 flex items-end gap-1 md:col-start-auto">
                  <Btn variant="ghost" aria-label="Lëviz lart" disabled={i === 0} onClick={() => images.move(i, i - 1)} className="w-10 px-0">
                    <ArrowUp aria-hidden size={16} strokeWidth={1.5} />
                  </Btn>
                  <Btn variant="ghost" aria-label="Lëviz poshtë" disabled={i === images.fields.length - 1} onClick={() => images.move(i, i + 1)} className="w-10 px-0">
                    <ArrowDown aria-hidden size={16} strokeWidth={1.5} />
                  </Btn>
                  <Btn variant="ghost" aria-label="Hiq foton" onClick={() => images.remove(i)} className="w-10 px-0">
                    <Trash2 aria-hidden size={16} strokeWidth={1.5} />
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Masat standarde dhe stoku">
        <p className="mb-3 text-[0.8125rem] text-stone">
          {availability === "in_stock" ? "Stoku zbret vetë me çdo porosi dhe kthehet kur porosia anulohet; masa me 0 copë shfaqet e shuar." : "Fustanet me porosi nuk kanë stok; shëno vetëm cilat masa ofrohen."} &quot;Me masa&quot; ofrohet gjithmonë.
        </p>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {SIZES.map((s) => (
            <div key={s} className="rounded-admin border border-hairline p-3">
              <Toggle label={<span className="font-medium">{s}</span>} {...register(`sizes.${s}.offered`)} />
              {availability === "in_stock" && <TextInput aria-label={`Stoku për ${s}`} inputMode="numeric" className="mt-2 h-8" {...register(`sizes.${s}.stock`)} />}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Masat që kërkon udhëzuesi">
        <p className="mb-3 text-[0.8125rem] text-stone">Gjithmonë: {always.map((d) => d.label.sq).join(", ")}. Shto këtu ato që kërkon ky model.</p>
        <Controller
          control={control}
          name="measurements"
          render={({ field }) => (
            <div className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {conditional.map((d) => (
                <Toggle
                  key={d.id}
                  label={d.label.sq}
                  checked={field.value.includes(d.id)}
                  onChange={(e) => field.onChange(e.target.checked ? [...field.value, d.id] : field.value.filter((x) => x !== d.id))}
                />
              ))}
            </div>
          )}
        />
      </Panel>

      <Panel title="SEO">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={<span className="flex justify-between">Titulli (shqip) {count(seo[0] ?? "", 70)}</span>} htmlFor="sts" hint="Bosh = emri i produktit.">
            <TextInput id="sts" {...register("seoTitleSq")} />
          </Field>
          <Field label={<span className="flex justify-between">Titulli (anglisht) {count(seo[1] ?? "", 70)}</span>} htmlFor="ste">
            <TextInput id="ste" {...register("seoTitleEn")} />
          </Field>
          <Field label={<span className="flex justify-between">Përshkrimi (shqip) {count(seo[2] ?? "", 170)}</span>} htmlFor="sds" hint="Bosh = fillimi i përshkrimit.">
            <TextArea id="sds" {...register("seoDescSq")} />
          </Field>
          <Field label={<span className="flex justify-between">Përshkrimi (anglisht) {count(seo[3] ?? "", 170)}</span>} htmlFor="sde">
            <TextArea id="sde" {...register("seoDescEn")} />
          </Field>
        </div>
      </Panel>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-hairline bg-white/95 lg:left-60">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-3 px-4 md:px-8">
          {product ? (
            <Btn variant="danger" onClick={() => setConfirmDelete(true)}>
              Fshij
            </Btn>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {product?.published && (
              <Btn asChild>
                <a href={`/sq/fustan/${product.slug}`} target="_blank" rel="noopener">
                  Shiko në faqe
                </a>
              </Btn>
            )}
            <Btn variant="primary" type="submit" loading={pending} disabled={uploading}>
              Ruaj produktin
            </Btn>
          </div>
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Ta fshijmë produktin?"
        description="Fotot fshihen gjithashtu. Porositë e vjetra e ruajnë emrin dhe çmimin. Nëse vetëm do ta fshehësh, hiqe nga publikimi."
        actions={
          <>
            <Btn onClick={() => setConfirmDelete(false)}>Anulo</Btn>
            <Btn variant="danger" onClick={onDelete} loading={pending}>
              Fshije
            </Btn>
          </>
        }
      />
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { deleteAddress, saveAddress } from "@/app/actions/account";
import type { SavedAddress } from "@/lib/account/types";
import { addressSchema } from "@/lib/validation/checkout";
import { toast } from "@/stores/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConfirmDelete } from "./confirm-delete";

const formSchema = addressSchema.extend({
  phone: z.string().trim().max(30, "tooLong").optional(),
  isDefault: z.boolean(),
});
type FormValues = z.input<typeof formSchema>;

export type CountryName = { code: string; name: string };

export function AddressesView({ addresses, countries, defaultCountry }: { addresses: SavedAddress[]; countries: CountryName[]; defaultCountry: string }) {
  const t = useTranslations("account.addresses");
  const ta = useTranslations("account");
  const tc = useTranslations("checkout");
  const tf = useTranslations("forms");
  const tcommon = useTranslations("common");
  const router = useRouter();
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null);
  const [deleting, setDeleting] = useState<SavedAddress | null>(null);
  const [pending, startTransition] = useTransition();
  const names = new Map(countries.map((c) => [c.code, c.name]));

  const empty: FormValues = { firstName: "", lastName: "", line1: "", line2: "", city: "", postalCode: "", region: "", country: defaultCountry, phone: "", isDefault: addresses.length === 0 };
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), mode: "onTouched", defaultValues: empty });

  const err = (m?: string) => (!m ? undefined : m === "required" ? tf("required") : tc(`errors.${m}` as "errors.tooLong"));

  function open(a: SavedAddress | "new") {
    reset(a === "new" ? empty : { ...a, line2: a.line2 ?? "", postalCode: a.postalCode ?? "", region: a.region ?? "", phone: a.phone ?? "" });
    setEditing(a);
  }

  const onSubmit = (values: FormValues) =>
    startTransition(async () => {
      const res = await saveAddress({ ...values, id: editing && editing !== "new" ? editing.id : undefined });
      if (!res.ok) return toast({ title: ta("failure"), tone: "error" });
      toast({ title: t("saved"), tone: "success" });
      setEditing(null);
      router.refresh();
    });

  const onDelete = () =>
    startTransition(async () => {
      if (!deleting) return;
      const res = await deleteAddress(deleting.id);
      setDeleting(null);
      if (!res.ok) return toast({ title: ta("failure"), tone: "error" });
      toast({ title: t("deleted"), tone: "success" });
      router.refresh();
    });

  return (
    <div>
      <p className="text-body text-stone">{t("intro")}</p>
      {addresses.length === 0 ? (
        <p className="mt-8 font-serif text-h3">{t("empty")}</p>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col border border-hairline p-6">
              {a.isDefault && <Badge tone="gold" className="mb-4 self-start">{t("default")}</Badge>}
              <address className="not-italic text-small leading-relaxed">
                <span className="block text-body">
                  {a.firstName} {a.lastName}
                </span>
                <span className="block">{a.line1}</span>
                {a.line2 && <span className="block">{a.line2}</span>}
                <span className="block">{[a.postalCode, a.city].filter(Boolean).join(" ")}</span>
                {a.region && <span className="block">{a.region}</span>}
                <span className="block">{names.get(a.country) ?? a.country}</span>
                {a.phone && <span className="nums mt-2 block text-stone">{a.phone}</span>}
              </address>
              <div className="mt-auto flex gap-6 pt-4">
                <button type="button" onClick={() => open(a)} className="flex min-h-11 items-center text-small">
                  <span className="link-underline">{t("edit")}</span>
                </button>
                <button type="button" onClick={() => setDeleting(a)} className="flex min-h-11 items-center text-small text-stone hover:text-ink">
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
          <Button type="submit" form="address-form" loading={pending} className="w-full">
            {t("save")}
          </Button>
        }
      >
        <form id="address-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-2 gap-x-4 gap-y-6">
          <Controller
            control={control}
            name="country"
            render={({ field }) => (
              <Select label={tc("country")} options={countries.map((c) => ({ value: c.code, label: c.name }))} autoComplete="country" className="col-span-2" {...field} />
            )}
          />
          <Input label={tc("firstName")} autoComplete="given-name" error={err(errors.firstName?.message)} className="max-sm:col-span-2" {...register("firstName")} />
          <Input label={tc("lastName")} autoComplete="family-name" error={err(errors.lastName?.message)} className="max-sm:col-span-2" {...register("lastName")} />
          <Input label={tc("address1")} autoComplete="address-line1" error={err(errors.line1?.message)} className="col-span-2" {...register("line1")} />
          <Input label={tc("address2")} optionalLabel={tcommon("optional")} autoComplete="address-line2" className="col-span-2" {...register("line2")} />
          <Input label={tc("city")} autoComplete="address-level2" error={err(errors.city?.message)} {...register("city")} />
          <Input label={tc("postalCode")} optionalLabel={tcommon("optional")} autoComplete="postal-code" {...register("postalCode")} />
          <Input label={tc("region")} optionalLabel={tcommon("optional")} autoComplete="address-level1" className="col-span-2" {...register("region")} />
          <Input label={tc("phone")} optionalLabel={tcommon("optional")} type="tel" inputMode="tel" autoComplete="tel" className="col-span-2" {...register("phone")} />
          <Checkbox label={t("makeDefault")} className="col-span-2" {...register("isDefault")} />
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

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { changeOrderStatus } from "@/app/actions/admin-orders";
import type { OrderStatus, PaymentMethodId } from "@/lib/commerce/types";
import { NEXT_STATUSES } from "@/lib/commerce/workflow";
import { toast } from "@/stores/toast";
import { Modal } from "@/components/ui/modal";
import { Btn, Field, STATUS_LABELS, TextArea, TextInput } from "./ui";

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  paid: "Shëno si të paguar",
  in_production: "Fillo punën",
  shipped: "Shëno si të nisur",
  delivered: "Shëno si të dorëzuar",
  cancelled: "Anulo porosinë",
};

type Values = { note: string; reference: string; trackingNumber: string; trackingCarrier: string };

export function OrderActions({ orderId, status, paymentMethod }: { orderId: string; status: OrderStatus; paymentMethod: PaymentMethodId }) {
  const router = useRouter();
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, reset } = useForm<Values>({ defaultValues: { note: "", reference: "", trackingNumber: "", trackingCarrier: "" } });
  const next = NEXT_STATUSES[status];

  if (next.length === 0) return <p className="text-stone">Porosia ka përfunduar.</p>;

  const submit = (v: Values) =>
    startTransition(async () => {
      if (!target) return;
      const res = await changeOrderStatus({ orderId, to: target, ...v });
      if (!res.ok) return setError(res.error);
      toast({ title: `Statusi: ${STATUS_LABELS[target]}`, description: target === "cancelled" ? undefined : "Klientja u njoftua me email.", tone: "success" });
      setTarget(null);
      reset();
      router.refresh();
    });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {next.map((s) => (
          <Btn
            key={s}
            variant={s === "cancelled" ? "danger" : "primary"}
            onClick={() => {
              setError(null);
              setTarget(s);
            }}
          >
            {ACTION_LABELS[s]}
          </Btn>
        ))}
      </div>
      {status === "awaiting_payment" && paymentMethod === "paysera" && (
        <p className="mt-3 text-[0.8125rem] text-stone">Pagesat me kartelë shënohen vetë kur Paysera i konfirmon. Shënoje me dorë vetëm nëse e ke parë pagesën te Paysera.</p>
      )}

      <Modal
        open={target !== null}
        onOpenChange={(v) => !v && setTarget(null)}
        title={target ? ACTION_LABELS[target] : ""}
        description={target === "cancelled" ? "Klientja njoftohet me email. Ky veprim nuk kthehet mbrapsht." : "Klientja njoftohet me email në gjuhën e saj."}
        actions={
          <>
            <Btn onClick={() => setTarget(null)}>Anulo</Btn>
            <Btn variant={target === "cancelled" ? "danger" : "primary"} type="submit" form="status-form" loading={pending}>
              Konfirmo
            </Btn>
          </>
        }
      >
        <form id="status-form" onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="rounded-admin border border-error/60 px-3 py-2 text-[0.8125rem] text-error">
              {error}
            </p>
          )}
          {target === "paid" && (
            <Field label="Referenca e pagesës (opsionale)" htmlFor="reference" hint="P.sh. numri i transfertës ose MTCN.">
              <TextInput id="reference" maxLength={120} {...register("reference")} />
            </Field>
          )}
          {target === "shipped" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Numri i gjurmimit" htmlFor="tracking">
                <TextInput id="tracking" maxLength={80} required {...register("trackingNumber")} />
              </Field>
              <Field label="Kompania postare" htmlFor="carrier">
                <TextInput id="carrier" maxLength={80} placeholder="P.sh. DHL" {...register("trackingCarrier")} />
              </Field>
            </div>
          )}
          <Field label="Shënim i brendshëm (opsional)" htmlFor="note" hint="Shfaqet vetëm në historikun e porosisë.">
            <TextArea id="note" maxLength={500} {...register("note")} />
          </Field>
        </form>
      </Modal>
    </>
  );
}

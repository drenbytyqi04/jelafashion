"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { retryCardPayment } from "@/app/actions/checkout";
import { Button } from "@/components/ui/button";

const POLL_MS = 4000;
const POLL_FOR_MS = 3 * 60 * 1000;

/**
 * Paysera's callback usually lands within seconds of the customer's return; until then
 * the page re-renders on its own. After a cancel, offers a new attempt.
 */
export function CardPaymentStatus({ token, cancelled }: { token: string; cancelled: boolean }) {
  const t = useTranslations("order");
  const tc = useTranslations("checkout");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (cancelled) return;
    const started = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - started > POLL_FOR_MS) window.clearInterval(id);
      else router.refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [cancelled, router]);

  function retry() {
    startTransition(async () => {
      const res = await retryCardPayment(token);
      if (res.ok) window.location.assign(res.redirect);
      else setFailed(true);
    });
  }

  return (
    <div className="border border-hairline bg-linen p-6">
      <p role="status" className="text-body">
        {cancelled ? t("paymentCancelled") : t("paymentPending")}
      </p>
      <Button onClick={retry} loading={pending} variant={cancelled ? "primary" : "secondary"} className="mt-6">
        {t("retryPayment")}
      </Button>
      {failed && (
        <p role="alert" className="mt-3 text-small text-error">
          {tc("errors.failure")}
        </p>
      )}
    </div>
  );
}

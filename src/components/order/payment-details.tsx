"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { DetailKey } from "@/lib/commerce/present";
import { toast } from "@/stores/toast";

/** Bank / agency / Wise details as a definition list, each value copyable in one tap. */
export function PaymentDetails({ rows }: { rows: { key: DetailKey; value: string; copy?: boolean }[] }) {
  const t = useTranslations("payment");
  const [copied, setCopied] = useState<DetailKey | null>(null);

  async function copy(key: DetailKey, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast({ title: t("copied", { label: t(key) }) });
      window.setTimeout(() => setCopied((k) => (k === key ? null : k)), 2000);
    } catch {
      // Clipboard blocked (permissions, old browser): the value stays selectable.
    }
  }

  return (
    <dl className="flex flex-col">
      {rows.map((r) => (
        <div
          key={r.key}
          className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 border-t border-hairline py-1 first:border-t-0 sm:grid-cols-[minmax(0,9rem)_1fr_auto]"
        >
          <dt className="text-small text-stone">{t(r.key)}</dt>
          <dd className="nums min-w-0 break-words text-small text-ink">{r.value}</dd>
          <dd className="-mr-3">
            {r.copy ? (
              <button
                type="button"
                onClick={() => copy(r.key, r.value)}
                aria-label={t("copy", { label: t(r.key) })}
                className="flex size-11 items-center justify-center text-stone hover:text-ink"
              >
                {copied === r.key ? <Check aria-hidden size={18} strokeWidth={1.25} /> : <Copy aria-hidden size={18} strokeWidth={1.25} />}
              </button>
            ) : (
              <span aria-hidden className="block size-11" />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

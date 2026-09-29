"use client";

import { CircleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export type SummaryError = { fieldId: string; message: string };

/**
 * Shown after a failed submit: takes focus, lists each problem and links to its field.
 * Inline errors stay in place; this is the map, not a replacement.
 */
export function ErrorSummary({
  errors,
  submitCount,
  autoFocus = true,
}: {
  errors: SummaryError[];
  submitCount: number;
  /** Off only for static previews (styleguide). */
  autoFocus?: boolean;
}) {
  const t = useTranslations("forms");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoFocus && submitCount > 0 && errors.length > 0) ref.current?.focus();
    // Focus only when a new submit fails, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  if (errors.length === 0 || submitCount === 0) return null;

  return (
    <div ref={ref} tabIndex={-1} role="alert" className="mb-8 border border-error px-5 py-4 outline-none focus-visible:outline-1">
      <p className="flex items-center gap-2 text-small font-medium text-error">
        <CircleAlert aria-hidden size={16} strokeWidth={1.5} />
        {t("errorSummary", { count: errors.length })}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {errors.map((e) => (
          <li key={e.fieldId}>
            <a
              href={`#${e.fieldId}`}
              onClick={(ev) => {
                ev.preventDefault();
                document.getElementById(e.fieldId)?.focus();
              }}
              className="link-underline text-small text-ink"
            >
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

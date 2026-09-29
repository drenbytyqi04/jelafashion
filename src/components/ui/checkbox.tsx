"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { describedBy, FieldError } from "./field";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  error?: ReactNode;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id: idProp, className, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={id} className="group flex min-h-11 items-start gap-3 py-2 text-small text-ink">
        <span className="relative mt-px flex size-5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(id, undefined, error)}
            className={cn(
              "peer absolute inset-0 appearance-none border border-field bg-ivory",
              "transition-colors duration-(--duration-micro) checked:border-ink checked:bg-ink",
              "group-hover:border-ink aria-invalid:border-error",
            )}
            {...props}
          />
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none relative size-3.5 text-champagne opacity-0 transition-opacity duration-(--duration-micro) peer-checked:opacity-100"
          >
            <path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="pt-px">{label}</span>
      </label>
      <FieldError id={id}>{error}</FieldError>
    </div>
  );
});

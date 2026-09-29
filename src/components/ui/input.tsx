"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { describedBy, FieldError, FieldHint, FieldLabel } from "./field";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Shown inside the field on the right, e.g. "cm". Never typed by the user. */
  suffix?: ReactNode;
  optionalLabel?: string;
  /** Larger numeric style for the measurement wizard. */
  size?: "md" | "lg";
};

export const inputClass =
  "w-full border border-field bg-ivory px-4 text-body text-ink placeholder:text-stone " +
  "transition-[border-color] duration-(--duration-micro) hover:border-ink " +
  "aria-invalid:border-error disabled:cursor-not-allowed disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, suffix, optionalLabel, size = "md", id: idProp, className, ...props },
  ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;

  return (
    <div className={className}>
      <FieldLabel htmlFor={id} optionalLabel={optionalLabel}>
        {label}
      </FieldLabel>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(
            inputClass,
            size === "md" ? "h-[52px]" : "nums h-16 font-serif text-[1.75rem]",
            suffix ? "pr-14" : undefined,
          )}
          {...props}
        />
        {suffix && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-small text-stone"
          >
            {suffix}
          </span>
        )}
      </div>
      <FieldHint id={id}>{hint}</FieldHint>
      <FieldError id={id}>{error}</FieldError>
    </div>
  );
});

"use client";

import { ChevronDown } from "lucide-react";
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { describedBy, FieldError, FieldHint, FieldLabel } from "./field";
import { inputClass } from "./input";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: ReactNode;
  options: SelectOption[];
  placeholder?: string;
  hint?: ReactNode;
  error?: ReactNode;
  optionalLabel?: string;
};

// Native <select>: the OS picker is the best experience on mobile, handles long lists
// (all countries) and is accessible without extra code.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, hint, error, optionalLabel, id: idProp, className, ...props },
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
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(inputClass, "h-[52px] appearance-none pr-12")}
          {...props}
        >
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          size={18}
          strokeWidth={1.25}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink"
        />
      </div>
      <FieldHint id={id}>{hint}</FieldHint>
      <FieldError id={id}>{error}</FieldError>
    </div>
  );
});

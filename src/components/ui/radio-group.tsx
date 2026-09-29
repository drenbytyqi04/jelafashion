"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { FieldError, fieldIds } from "./field";
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe";

export type RadioOption = {
  value: string;
  label: ReactNode;
  /** Right-aligned detail, e.g. a price or logos. */
  aside?: ReactNode;
  description?: ReactNode;
  /** Card variant only: revealed while the option is selected. */
  content?: ReactNode;
  disabled?: boolean;
};

export type RadioGroupProps = {
  name: string;
  legend: ReactNode;
  options: RadioOption[];
  value: string | undefined;
  onValueChange: (value: string) => void;
  variant?: "list" | "card";
  error?: ReactNode;
  /** Visually hide the legend when a heading already labels the group. */
  hideLegend?: boolean;
  className?: string;
};

// Native radios inside a fieldset: arrow keys, form semantics and screen readers work
// without extra ARIA.
export function RadioGroup({
  name,
  legend,
  options,
  value,
  onValueChange,
  variant = "list",
  error,
  hideLegend,
  className,
}: RadioGroupProps) {
  const groupId = useId();
  const reduce = useReducedMotionSafe();

  return (
    <fieldset
      className={className}
      aria-describedby={error ? fieldIds(groupId).errorId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className={cn("mb-3 text-small text-ink", hideLegend && "sr-only")}>{legend}</legend>
      <div className={cn(variant === "card" ? "flex flex-col gap-3" : "flex flex-col")}>
        {options.map((option) => {
          const id = `${groupId}-${option.value}`;
          const checked = value === option.value;
          return (
            <div
              key={option.value}
              className={cn(
                variant === "card" &&
                  "relative border transition-colors duration-(--duration-micro)",
                variant === "card" && (checked ? "border-ink" : "border-field hover:border-ink"),
                variant === "card" && error && !checked && "border-error",
              )}
            >
              {variant === "card" && checked && (
                <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-champagne" />
              )}
              <label
                htmlFor={id}
                className={cn(
                  "flex min-h-11 items-center gap-4",
                  variant === "card" ? "px-5 py-4" : "py-2",
                  option.disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={checked}
                  disabled={option.disabled}
                  onChange={() => onValueChange(option.value)}
                  className={cn(
                    "size-5 shrink-0 appearance-none rounded-full border border-field bg-ivory",
                    "transition-[border-color,border-width] duration-(--duration-micro)",
                    "checked:border-[6px] checked:border-ink",
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body">{option.label}</span>
                  {option.description && (
                    <span className="text-small text-stone">{option.description}</span>
                  )}
                </span>
                {option.aside && <span className="shrink-0 text-small text-ink">{option.aside}</span>}
              </label>
              {variant === "card" && option.content && (
                <AnimatePresence initial={false}>
                  {checked && (
                    <motion.div
                      key="content"
                      initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: duration.ui, ease: ease.couture }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-hairline px-5 pb-5 pt-4 text-small">
                        {option.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
      </div>
      <FieldError id={groupId}>{error}</FieldError>
    </fieldset>
  );
}

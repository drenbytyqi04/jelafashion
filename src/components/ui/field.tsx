import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FieldMessageProps = {
  id: string;
  hint?: ReactNode;
  error?: ReactNode;
  hintId: string;
};

/** Shared ids so every control wires aria-describedby the same way. */
export function fieldIds(id: string) {
  return { hintId: `${id}-hint`, errorId: `${id}-error` };
}

export function describedBy(id: string, hint?: ReactNode, error?: ReactNode) {
  const { hintId, errorId } = fieldIds(id);
  return [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
}

export function FieldLabel({
  htmlFor,
  children,
  optionalLabel,
  className,
}: {
  htmlFor: string;
  children: ReactNode;
  optionalLabel?: string;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-2 block text-small text-ink", className)}>
      {children}
      {optionalLabel && <span className="text-stone"> ({optionalLabel})</span>}
    </label>
  );
}

export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={fieldIds(id).hintId} className="mt-2 text-small text-stone">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  // Always rendered so screen readers announce new errors in the live region.
  return (
    <p
      id={fieldIds(id).errorId}
      role="alert"
      className={cn("flex items-start gap-2 text-small text-error", children ? "mt-2" : "sr-only")}
    >
      {children && <CircleAlert aria-hidden size={16} strokeWidth={1.5} className="mt-[3px] shrink-0" />}
      {children}
    </p>
  );
}

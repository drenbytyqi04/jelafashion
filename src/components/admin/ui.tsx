import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/lib/commerce/types";

// Admin primitives (pages/admin.md): a working tool, calm and dense. Manrope 14px, white
// panels on ivory, 4px radius, no motion beyond drawers and toasts.

export const controlClass =
  "w-full rounded-admin border border-field bg-white px-3 text-[0.875rem] text-ink placeholder:text-stone hover:border-ink aria-invalid:border-error disabled:opacity-60";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[0.75rem] text-stone">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-[0.75rem] text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput({ className, ...props }, ref) {
  return <input ref={ref} className={cn(controlClass, "h-10", className)} {...props} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(controlClass, "py-2 leading-relaxed", className)} {...props} />;
});

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }>(
  function SelectInput({ className, options, ...props }, ref) {
    return (
      <select ref={ref} className={cn(controlClass, "h-10 pr-8", className)} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  },
);

export const Toggle = forwardRef<HTMLInputElement, Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }>(function Toggle({ label, className, ...props }, ref) {
  return (
    <label className={cn("flex min-h-10 cursor-pointer items-center gap-2 text-[0.875rem]", className)}>
      <input ref={ref} type="checkbox" className="size-4 accent-ink" {...props} />
      {label}
    </label>
  );
});

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-champagne border-champagne text-ink hover:bg-champagne-deep hover:border-champagne-deep",
  secondary: "bg-white border-field text-ink hover:border-ink",
  ghost: "bg-transparent border-transparent text-ink hover:bg-linen",
  danger: "bg-white border-error/60 text-error hover:border-error",
};

export const Btn = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "md" | "sm"; asChild?: boolean; loading?: boolean }
>(function Btn({ variant = "secondary", size = "md", asChild, loading, className, disabled, type, children, ...props }, ref) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-admin border text-[0.8125rem] font-medium transition-colors disabled:opacity-60",
        size === "md" ? "h-10 px-4" : "h-8 px-3",
        btnVariants[variant],
        className,
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {children}
          {loading && (
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
              <span className="block h-full w-1/3 animate-[button-progress_1.2s_linear_infinite] bg-ink" />
            </span>
          )}
        </>
      )}
    </Comp>
  );
});

export function Panel({ title, actions, className, children }: { title?: ReactNode; actions?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-admin border border-hairline bg-white", className)}>
      {(title || actions) && (
        <header className="flex min-h-12 items-center justify-between gap-4 border-b border-hairline px-4">
          {title && <h2 className="text-[0.9375rem] font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.375rem] font-semibold leading-tight">{title}</h1>
        {description && <p className="mt-1 text-[0.875rem] text-stone">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_payment: "Në pritje të pagesës",
  paid: "E paguar",
  in_production: "Në punim",
  shipped: "E nisur",
  delivered: "E dorëzuar",
  cancelled: "E anuluar",
};

const statusTone: Record<OrderStatus, string> = {
  awaiting_payment: "border-gold-ink text-gold-ink",
  paid: "border-success text-success",
  in_production: "border-ink text-ink",
  shipped: "border-ink text-ink",
  delivered: "border-success text-success",
  cancelled: "border-stone text-stone",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={cn("inline-flex h-6 items-center whitespace-nowrap rounded-admin border px-2 text-[0.75rem]", statusTone[status])}>{STATUS_LABELS[status]}</span>;
}

/** Tables: sticky header, 44px rows, linen hover. */
export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-admin border border-hairline bg-white", className)}>
      <table className="w-full border-collapse text-[0.8125rem]">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-hairline text-left">
            {head.map((h, i) => (
              <th key={i} scope="col" className="h-10 whitespace-nowrap px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-stone">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:h-11 [&>tr]:border-b [&>tr]:border-hairline [&>tr:hover]:bg-linen [&>tr:last-child]:border-b-0 [&_td]:px-3">{children}</tbody>
      </table>
    </div>
  );
}

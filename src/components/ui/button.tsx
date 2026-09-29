"use client";

import { Slot } from "radix-ui";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Magnetic } from "@/components/motion/magnetic";

type Variant = "primary" | "secondary" | "on-image" | "text";
type Size = "md" | "sm";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Render the child element (e.g. a Link) with button styles. */
  asChild?: boolean;
  /** Full width on mobile, auto from md up. */
  block?: boolean;
  /** Keeps width, disables, shows a champagne progress line. */
  loading?: boolean;
  /** Desktop-only magnetic pull. Use on primary calls to action only. */
  magnetic?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-champagne text-ink border border-champagne hover:bg-champagne-deep hover:border-champagne-deep",
  secondary: "bg-transparent text-ink border border-ink hover:bg-ink hover:text-ivory",
  "on-image":
    "on-image bg-transparent text-white border border-white hover:bg-white hover:text-ink",
  text: "link-underline px-0 min-h-11 border-0 bg-transparent text-ink",
};

const sizes: Record<Size, string> = {
  md: "min-h-[52px] px-8",
  sm: "min-h-11 px-5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    asChild,
    block,
    loading,
    magnetic,
    disabled,
    className,
    children,
    type,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  const element = (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? "button")}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "label relative inline-flex select-none items-center justify-center gap-3 overflow-hidden text-center",
        "transition-[background-color,color,border-color] duration-(--duration-ui) ease-(--ease-couture)",
        "disabled:opacity-60",
        variant !== "text" && sizes[size],
        variants[variant],
        block && "w-full md:w-auto",
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

  return magnetic ? <Magnetic className={block ? "w-full md:w-auto" : undefined}>{element}</Magnetic> : element;
});

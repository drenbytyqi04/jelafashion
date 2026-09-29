import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "gold" | "ink";

const tones: Record<Tone, string> = {
  neutral: "border-stone text-stone",
  success: "border-success text-success",
  gold: "border-gold-ink text-gold-ink",
  ink: "border-ink text-ink",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label inline-flex min-h-7 items-center border px-3 py-1 text-[0.6875rem]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

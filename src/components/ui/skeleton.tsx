import { cn } from "@/lib/cn";

/** Linen block with a slow opacity pulse. Size it exactly like the content it stands in for. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-skeleton bg-linen", className)} />;
}

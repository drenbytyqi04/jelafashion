"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { useLenisLock } from "@/components/motion/use-scroll-lock";

type Side = "right" | "left" | "bottom";

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
  side?: Side;
  /** Content pinned under the scroll area, e.g. the primary action. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

const offscreen: Record<Side, { x?: string; y?: string }> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  bottom: { y: "100%" },
};

const placement: Record<Side, string> = {
  right: "inset-y-0 right-0 h-dvh w-full max-w-[480px] border-l",
  left: "inset-y-0 left-0 h-dvh w-full max-w-[480px] border-r",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] w-full border-t",
};

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  hideTitle,
  side = "right",
  footer,
  children,
  className,
}: DrawerProps) {
  const t = useTranslations("common");
  const reduce = useReducedMotion();
  useLenisLock(open);

  const hidden = reduce ? { opacity: 0 } : { ...offscreen[side] };
  const shown = reduce ? { opacity: 1 } : { x: 0, y: 0 };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-ink/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.ui, ease: ease.couture }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                data-lenis-prevent
                className={cn(
                  "fixed z-50 flex flex-col border-hairline bg-ivory focus:outline-none",
                  placement[side],
                  className,
                )}
                initial={hidden}
                animate={shown}
                exit={hidden}
                transition={{ duration: 0.6, ease: ease.couture }}
              >
                <div className="flex min-h-16 items-center justify-between gap-4 border-b border-hairline pl-6 pr-2">
                  <Dialog.Title className={cn("font-serif text-h3", hideTitle && "sr-only")}>
                    {title}
                  </Dialog.Title>
                  <Dialog.Close
                    className="flex size-11 items-center justify-center text-ink"
                    aria-label={t("close")}
                  >
                    <X aria-hidden size={22} strokeWidth={1.25} />
                  </Dialog.Close>
                </div>
                {description ? (
                  <Dialog.Description className="px-6 pt-4 text-small text-stone">
                    {description}
                  </Dialog.Description>
                ) : (
                  <Dialog.Description className="sr-only">{title}</Dialog.Description>
                )}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>
                {footer && (
                  <div className="border-t border-hairline px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {footer}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

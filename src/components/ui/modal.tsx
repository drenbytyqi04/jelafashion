"use client";

import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { Dialog } from "radix-ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { useLenisLock } from "@/components/motion/use-scroll-lock";
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe";

export type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row. */
  actions?: ReactNode;
  className?: string;
};

export function Modal({ open, onOpenChange, title, description, children, actions, className }: ModalProps) {
  const t = useTranslations("common");
  const reduce = useReducedMotionSafe();
  useLenisLock(open);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 bg-ink/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.ui, ease: ease.couture }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
              <Dialog.Content asChild forceMount>
                <m.div
                  data-lenis-prevent
                  className={cn(
                    "pointer-events-auto relative max-h-[90dvh] w-full overflow-y-auto border-t border-hairline bg-ivory px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-10 focus:outline-none md:max-w-[560px] md:border md:p-12",
                    className,
                  )}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  transition={{ duration: duration.ui, ease: ease.couture }}
                >
                  <Dialog.Close
                    className="absolute right-2 top-2 flex size-11 items-center justify-center text-ink"
                    aria-label={t("close")}
                  >
                    <X aria-hidden size={22} strokeWidth={1.25} />
                  </Dialog.Close>
                  <Dialog.Title className="pr-10 font-serif text-h3">{title}</Dialog.Title>
                  {description ? (
                    <Dialog.Description className="mt-3 text-body text-stone">{description}</Dialog.Description>
                  ) : (
                    <Dialog.Description className="sr-only">{title}</Dialog.Description>
                  )}
                  {children && <div className="mt-6">{children}</div>}
                  {actions && <div className="mt-8 flex flex-col gap-3 md:flex-row-reverse">{actions}</div>}
                </m.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

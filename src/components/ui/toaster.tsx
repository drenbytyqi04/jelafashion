"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { Toast } from "radix-ui";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { useToastStore } from "@/stores/toast";

// Radix Toast: announced politely, pauses on hover/focus, swipe to dismiss, F8 to focus.
export function Toaster() {
  const t = useTranslations("common");
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <Toast.Provider duration={6000} swipeDirection="down" label={t("close")}>
      {toasts.map((item) => {
        const Icon = item.tone === "error" ? CircleAlert : item.tone === "success" ? CircleCheck : null;
        return (
          <Toast.Root
            key={item.id}
            type={item.tone === "error" ? "foreground" : "background"}
            onOpenChange={(open) => !open && dismiss(item.id)}
            className={cn(
              "toast relative flex items-start gap-3 border border-hairline bg-ivory py-4 pl-5 pr-12",
              item.tone === "error" && "border-error",
            )}
          >
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-champagne" />
            {Icon && (
              <Icon
                aria-hidden
                size={18}
                strokeWidth={1.25}
                className={cn("mt-0.5 shrink-0", item.tone === "error" ? "text-error" : "text-success")}
              />
            )}
            <div className="min-w-0">
              <Toast.Title className="text-small font-medium text-ink">{item.title}</Toast.Title>
              {item.description && (
                <Toast.Description className="mt-1 text-small text-stone">{item.description}</Toast.Description>
              )}
            </div>
            <Toast.Close
              aria-label={t("close")}
              className="absolute right-1 top-1 flex size-11 items-center justify-center text-ink"
            >
              <X aria-hidden size={18} strokeWidth={1.25} />
            </Toast.Close>
          </Toast.Root>
        );
      })}
      <Toast.Viewport className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] flex flex-col gap-3 outline-none md:left-auto md:right-8 md:bottom-8 md:w-[400px]" />
    </Toast.Provider>
  );
}

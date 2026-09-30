"use client";

import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/navigation";
import { whatsappHref } from "@/lib/site";
import { useConsentStore } from "@/stores/consent";
import { WhatsAppIcon } from "@/components/icons/brand-icons";

const useConsentDecided = () =>
  useSyncExternalStore(
    (cb) => useConsentStore.subscribe(cb),
    () => useConsentStore.persist.hasHydrated() && Boolean(useConsentStore.getState().decidedAt),
    () => false,
  );

/**
 * A quiet way to ask a question from any page. Hidden during checkout (focus mode), on
 * the dress page (its own WhatsApp link sits beside the sticky add-to-cart) and while the
 * cookie banner is up.
 */
export function WhatsAppBubble() {
  const t = useTranslations();
  const pathname = usePathname();
  const decided = useConsentDecided();
  const href = whatsappHref();
  if (!href || !decided || pathname.startsWith("/checkout") || pathname.startsWith("/dress")) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label={t("whatsappBubble")}
      title={t("whatsappBubble")}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex size-14 items-center justify-center rounded-full border border-hairline bg-ivory text-ink transition-colors duration-(--duration-micro) hover:border-ink md:bottom-8 md:right-8"
    >
      <WhatsAppIcon size={24} />
    </a>
  );
}

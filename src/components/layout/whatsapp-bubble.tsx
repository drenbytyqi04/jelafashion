"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { MeasurementDefinition } from "@/lib/catalog/types";
import { whatsappHref } from "@/lib/site";
import { useConsentStore } from "@/stores/consent";
import { toast } from "@/stores/toast";
import { WhatsAppIcon } from "@/components/icons/brand-icons";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { MeasurementWizard } from "@/components/wizard/measurement-wizard";

const HINT_KEY = "jf-custom-size-hint";

// persist sets its hydrated flag after the state update it notifies with, so listen for
// the end of hydration too, or a stored decision would never be seen.
const useConsentDecided = () =>
  useSyncExternalStore(
    (cb) => {
      const offState = useConsentStore.subscribe(cb);
      const offHydrated = useConsentStore.persist.onFinishHydration(cb);
      return () => {
        offState();
        offHydrated();
      };
    },
    () => useConsentStore.persist.hasHydrated() && Boolean(useConsentStore.getState().decidedAt),
    () => false,
  );

/**
 * True while a phone shows the top of the home page: the hero's two buttons sit at the
 * bottom of the screen there, so the floating buttons wait until she scrolls on.
 */
function useOverHeroCtas(active: boolean) {
  return useSyncExternalStore(
    (cb) => {
      if (!active) return () => {};
      window.addEventListener("scroll", cb, { passive: true });
      window.addEventListener("resize", cb);
      return () => {
        window.removeEventListener("scroll", cb);
        window.removeEventListener("resize", cb);
      };
    },
    () => active && window.innerWidth < 1024 && window.scrollY < window.innerHeight * 0.6,
    () => active,
  );
}

const circle =
  "flex size-12 items-center justify-center rounded-full border border-hairline bg-ivory text-ink transition-colors duration-(--duration-micro) hover:border-ink md:size-14";

/** A dress form beside a measuring line: the atelier's made-to-measure service. */
function CustomSizeIcon() {
  return (
    <svg aria-hidden width={26} height={26} viewBox="0 0 24 24" fill="none" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round">
      <g stroke="currentColor">
        <path d="M13.5 2.75h3v2h-3z" />
        <path d="M11 4.75h8c.5 2-1.2 3.6-1.2 5.6s2.2 3.1 2.2 6.9h-10c0-3.8 2.2-4.9 2.2-6.9S10.5 6.75 11 4.75Z" />
        <path d="M15 17.25v3.75M12.5 21h5" />
      </g>
      <g className="text-champagne" stroke="currentColor">
        <path d="M5 3.5v17" />
        <path d="M3.5 3.5h3M3.5 20.5h3M4.25 8h1.5M4.25 12h1.5M4.25 16h1.5" />
      </g>
    </svg>
  );
}

/**
 * Two quiet ways in from any page: a question on WhatsApp, and "Custom size" (with a
 * one-time hint the visitor can dismiss). Custom size opens a panel that starts the
 * measurement wizard with the measurements every dress needs; they are kept on the device
 * (or the account) and pre-fill the wizard on whichever dress she then chooses. Hidden
 * during checkout (focus mode), on the dress page (its own WhatsApp link and "Custom size"
 * sit beside the sticky add-to-cart), on the order page (it has its own WhatsApp link, and
 * the buttons would cover the bank details' copy buttons) and while the cookie banner is up.
 */
export function WhatsAppBubble({ definitions }: { definitions: MeasurementDefinition[] }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const decided = useConsentDecided();
  const href = whatsappHref();
  const [hint, setHint] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const onMadeToMeasure = pathname.startsWith("/made-to-measure");
  const tucked = useOverHeroCtas(pathname === "/");

  useEffect(() => {
    if (!decided || onMadeToMeasure) return;
    let seen = true;
    try {
      seen = localStorage.getItem(HINT_KEY) !== null;
    } catch {}
    if (seen) return;
    // A moment after the page settles, so it reads as an invitation, not an interruption.
    const id = window.setTimeout(() => setHint(true), 2500);
    return () => window.clearTimeout(id);
  }, [decided, onMadeToMeasure]);

  function dismissHint() {
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, new Date().toISOString());
    } catch {}
  }

  function openPanel() {
    dismissHint();
    setPanelOpen(true);
  }

  function start() {
    setPanelOpen(false);
    // Let the panel slide away before the full-screen wizard rises.
    window.setTimeout(() => setWizardOpen(true), 350);
  }

  if (!decided || ["/checkout", "/dress", "/order"].some((path) => pathname.startsWith(path))) return null;
  return (
    <div
      inert={tucked}
      className={
        "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 transition-[opacity,translate] duration-(--duration-ui) ease-(--ease-couture) motion-reduce:transition-none md:bottom-8 md:right-8 " +
        (tucked ? "pointer-events-none translate-y-3 opacity-0" : "translate-y-0 opacity-100")
      }
    >
      {href && (
        // WhatsApp's own green, so it is recognised at a glance (MASTER.md decision 33).
        <a
          href={href}
          target="_blank"
          rel="noopener"
          aria-label={t("whatsappBubble")}
          title={t("whatsappBubble")}
          className="flex size-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-12px_rgb(26_26_26/0.35)] transition-[filter] duration-(--duration-micro) hover:brightness-95 md:size-14"
        >
          <WhatsAppIcon size={28} strokeWidth={1.75} />
        </a>
      )}
      <div className="relative flex items-center">
        <div
          aria-hidden={!hint}
          inert={!hint}
          className={
            "absolute right-full mr-3 flex items-center gap-1 whitespace-nowrap border border-hairline bg-ivory py-1 pl-4 pr-1 text-small text-ink shadow-[0_8px_24px_-12px_rgb(26_26_26/0.25)] transition-[opacity,translate] duration-(--duration-ui) ease-(--ease-couture) motion-reduce:transition-none " +
            (hint ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-2 opacity-0")
          }
        >
          <button type="button" onClick={openPanel} tabIndex={-1} className="py-1">
            {t("customSizeBubble.label")}
          </button>
          <button
            type="button"
            onClick={dismissHint}
            aria-label={t("customSizeBubble.dismiss")}
            className="flex size-7 items-center justify-center text-stone hover:text-ink"
          >
            <X aria-hidden size={14} strokeWidth={1.25} />
          </button>
        </div>
        <button
          type="button"
          onClick={openPanel}
          aria-haspopup="dialog"
          aria-label={t("customSizeBubble.open")}
          title={t("customSizeBubble.open")}
          className={circle}
        >
          <CustomSizeIcon />
        </button>
      </div>

      <Drawer side="left" open={panelOpen} onOpenChange={setPanelOpen} title={t("customSizeBubble.label")} hideTitle>
        <p className="wordmark pt-2 text-center text-ink" aria-hidden>
          JELA FASHION
        </p>
        <span aria-hidden className="mx-auto mt-5 block h-px w-12 bg-champagne" />
        <div className="mt-16 lg:mt-24">
          <p className="font-serif text-h3 leading-snug">{t("customSizeBubble.panelTitle")}</p>
          <p className="mt-4 text-small text-stone">{t("customSizeBubble.panelText", { count: definitions.length })}</p>
          <Button className="mt-8" onClick={start}>
            {t("customSizeBubble.start")}
          </Button>
        </div>
      </Drawer>

      <MeasurementWizard
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        definitions={definitions}
        confirmLabel={t("customSizeBubble.save")}
        onComplete={() => {
          setWizardOpen(false);
          toast({ title: t("customSizeBubble.saved") });
          // The wizard pops its own history entry as it closes; navigate once that lands.
          window.setTimeout(() => router.push("/shop"), 400);
        }}
      />
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { Link } from "@/i18n/navigation";
import { useConsentStore } from "@/stores/consent";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const useConsentHydrated = () =>
  useSyncExternalStore(
    (cb) => useConsentStore.persist.onFinishHydration(cb),
    () => useConsentStore.persist.hasHydrated(),
    () => false,
  );

function Toggle({ id, label, text, checked, onChange, disabled, note }: { id: string; label: string; text: string; checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-hairline py-5">
      <div>
        <label htmlFor={id} className="text-body font-medium">
          {label}
        </label>
        <p id={`${id}-text`} className="mt-1 text-small text-stone">
          {text}
        </p>
      </div>
      {disabled ? (
        <span className="label shrink-0 pt-1 text-stone">{note}</span>
      ) : (
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-describedby={`${id}-text`}
          onClick={() => onChange?.(!checked)}
          className="relative mt-1 h-6 w-11 shrink-0 rounded-full border border-ink transition-colors duration-(--duration-micro) aria-checked:bg-ink"
        >
          <span
            aria-hidden
            className={`absolute left-0 top-1/2 size-4 -translate-y-1/2 rounded-full transition-transform duration-(--duration-micro) ${checked ? "translate-x-[22px] bg-champagne" : "translate-x-[3px] bg-ink"}`}
          />
        </button>
      )}
    </div>
  );
}

/**
 * First visit: a quiet bar at the bottom (a card on desktop), equal weight for accepting and
 * declining. Nothing optional runs before a choice. Preferences open from here, the footer
 * and the cookie page.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const hydrated = useConsentHydrated();
  const { decidedAt, preferencesOpen, acceptAll, rejectAll, openPreferences, closePreferences } = useConsentStore();

  return (
    <>
      {/* Server-rendered and shown by CSS until hydration; then React decides. Above the
          header and sticky bars, below dialogs (z-50): the menu, wizard and drawers cover it. */}
      {(!hydrated || (!decidedAt && !preferencesOpen)) && (
        <section
          aria-labelledby="consent-title"
          className={`${hydrated ? "" : "consent-ssr "}fixed inset-x-0 bottom-0 z-45 border-t border-hairline bg-ivory px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 md:inset-x-auto md:bottom-6 md:left-6 md:max-w-md md:border md:p-6`}
        >
          <h2 id="consent-title" className="font-serif text-[1.375rem] leading-tight">
            {t("title")}
          </h2>
          <p className="mt-2 text-small text-ink/80">
            {t("text")}{" "}
            <Link href="/cookies" className="link-underline">
              {t("policy")}
            </Link>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm" onClick={acceptAll}>
              {t("accept")}
            </Button>
            <Button size="sm" variant="secondary" onClick={rejectAll}>
              {t("reject")}
            </Button>
          </div>
          <button type="button" onClick={openPreferences} className="mt-2 flex min-h-11 items-center text-small">
            <span className="link-underline">{t("settings")}</span>
          </button>
        </section>
      )}
      <Modal
        open={preferencesOpen}
        onOpenChange={(open) => (open ? openPreferences() : closePreferences())}
        title={t("preferencesTitle")}
        description={t("preferencesText")}
      >
        {preferencesOpen && <Preferences />}
      </Modal>
    </>
  );
}

/** Mounted each time the panel opens, so it starts from the saved choices. */
function Preferences() {
  const t = useTranslations("consent");
  const { analytics, marketing, save, rejectAll } = useConsentStore();
  const [draft, setDraft] = useState({ analytics, marketing });
  return (
    <>
      <Toggle id="consent-necessary" label={t("necessary")} text={t("necessaryText")} checked disabled note={t("alwaysOn")} />
      <Toggle id="consent-analytics" label={t("analytics")} text={t("analyticsText")} checked={draft.analytics} onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))} />
      <Toggle id="consent-marketing" label={t("marketing")} text={t("marketingText")} checked={draft.marketing} onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))} />
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={rejectAll}>
          {t("reject")}
        </Button>
        <Button onClick={() => save(draft)}>{t("save")}</Button>
      </div>
    </>
  );
}

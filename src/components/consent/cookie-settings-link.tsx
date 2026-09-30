"use client";

import { useConsentStore } from "@/stores/consent";

/** Footer entry to change cookie choices at any time. */
export function CookieSettingsLink({ label }: { label: string }) {
  const open = useConsentStore((s) => s.openPreferences);
  return (
    <button type="button" onClick={open} className="flex min-h-11 items-center text-small text-stone hover:text-ink">
      {label}
    </button>
  );
}

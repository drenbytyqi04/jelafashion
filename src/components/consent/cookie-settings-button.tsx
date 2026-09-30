"use client";

import { useConsentStore } from "@/stores/consent";
import { Button } from "@/components/ui/button";

export function CookieSettingsButton({ label, variant = "secondary" }: { label: string; variant?: "secondary" | "text" }) {
  const open = useConsentStore((s) => s.openPreferences);
  return (
    <Button variant={variant} onClick={open}>
      {label}
    </Button>
  );
}

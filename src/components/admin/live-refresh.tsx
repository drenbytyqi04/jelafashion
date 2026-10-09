"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const INTERVAL_MS = 30_000;

/**
 * Keeps the panel current while it is open: re-fetches the page every 30 seconds (only
 * while the tab is visible) and puts the number of new orders in the tab title, so a new
 * order shows up without reloading.
 */
export function LiveRefresh({ unseen }: { unseen: number }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(tick, INTERVAL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router]);

  // Next sets the page title after navigation, so re-apply the count whenever it changes.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\)\s*/, "");
      const next = unseen > 0 ? `(${unseen}) ${base}` : base;
      if (document.title !== next) document.title = next;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [unseen, pathname]);

  return null;
}

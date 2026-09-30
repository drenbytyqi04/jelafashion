"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { useConsentStore } from "@/stores/consent";
import { Modal } from "@/components/ui/modal";
import { NewsletterForm } from "./newsletter-form";

const KEY = "jf-newsletter-prompt";
const DELAY_MS = 30_000;
/** Never interrupts buying, signing in or an order page. */
const QUIET = ["/checkout", "/cart", "/account", "/order", "/search"];

function seen() {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return true;
  }
}

/** Offered once per device, after 30 seconds and a scroll, once the cookie choice is made. */
export function NewsletterPopup() {
  const t = useTranslations("newsletterPopup");
  const pathname = usePathname();
  const decided = useConsentStore((s) => s.decidedAt);
  const [open, setOpen] = useState(false);
  const quiet = QUIET.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!decided || quiet || seen()) return;
    let scrolled = false;
    let timeUp = false;
    const show = () => {
      if (!scrolled || !timeUp || seen()) return;
      try {
        localStorage.setItem(KEY, new Date().toISOString());
      } catch {}
      setOpen(true);
    };
    const onScroll = () => {
      if (window.scrollY > 400) {
        scrolled = true;
        show();
      }
    };
    const timer = window.setTimeout(() => {
      timeUp = true;
      show();
    }, DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [decided, quiet]);

  return (
    <Modal open={open && !quiet} onOpenChange={setOpen} title={t("title")} description={t("text")}>
      <NewsletterForm source="popup" onSubscribed={() => setOpen(false)} />
      <button type="button" onClick={() => setOpen(false)} className="mt-2 flex min-h-11 items-center text-small text-stone">
        <span className="link-underline">{t("later")}</span>
      </button>
    </Modal>
  );
}

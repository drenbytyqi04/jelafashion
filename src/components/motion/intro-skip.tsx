"use client";

import { useEffect, useState } from "react";

// The button's CSS fades it out with the curtain; unmounting afterwards also removes it
// from the tab order and the accessibility tree.
const INTRO_MS = 2300;

export function IntroSkip({ storageKey, label }: { storageKey: string; label: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {}
    const timer = window.setTimeout(() => setDone(true), INTRO_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        skip();
        setDone(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [storageKey]);

  if (done) return null;

  return (
    <button
      type="button"
      onClick={() => {
        skip();
        setDone(true);
      }}
      className="intro-skip label fixed bottom-8 right-6 z-[71] min-h-11 px-4 text-stone hover:text-ink"
    >
      {label}
    </button>
  );
}

function skip() {
  document.documentElement.setAttribute("data-intro-skipped", "");
}

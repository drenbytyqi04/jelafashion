"use client";

import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Infinite strip. Pauses on hover and keyboard focus, stops off-screen, and has a visible
 * pause control (WCAG 2.2.2). Reduced motion: static, no control needed.
 */
export function Marquee({
  items,
  separator = "•",
  secondsPerLoop = 40,
  className,
}: {
  items: string[];
  separator?: string;
  secondsPerLoop?: number;
  className?: string;
}) {
  const t = useTranslations("common");
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = !paused && visible;
  const sequence = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((item, i) => (
        <li key={i} className="flex items-center">
          <span className="whitespace-nowrap px-6 md:px-10">{item}</span>
          <span aria-hidden className="text-champagne">
            {separator}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div
      ref={ref}
      className={cn("group relative flex items-center overflow-hidden border-y border-hairline", className)}
    >
      <div
        className="marquee-track label flex w-max py-5 text-ink motion-reduce:animate-none"
        style={{
          animationDuration: `${secondsPerLoop}s`,
          animationPlayState: running ? "running" : "paused",
        }}
      >
        {sequence(false)}
        {sequence(true)}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-pressed={paused}
        aria-label={paused ? t("playMotion") : t("pauseMotion")}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center border-l border-hairline bg-ivory text-stone hover:text-ink motion-reduce:hidden"
      >
        {paused ? <Play aria-hidden size={14} strokeWidth={1.25} /> : <Pause aria-hidden size={14} strokeWidth={1.25} />}
      </button>
    </div>
  );
}

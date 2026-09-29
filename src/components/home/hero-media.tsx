"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * Hero video slot. Muted, looping, inline; the poster shows first. Autoplay is skipped on
 * data-saver or slow connections and with reduced motion, leaving the poster.
 */
export function HeroMedia({ videoUrl, posterUrl }: { videoUrl: string | null; posterUrl: string | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!videoUrl) return;
    const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const slow = conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Decided once after mount from device conditions the server cannot know.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!slow && !reduce) setPlay(true);
  }, [videoUrl]);

  useEffect(() => {
    if (play) ref.current?.play().catch(() => {});
  }, [play]);

  if (!videoUrl) {
    return <ImagePlaceholder ratio="9/16" tint="#6B645C" className="h-full !aspect-auto" />;
  }

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
      src={play ? videoUrl : undefined}
      poster={posterUrl ?? undefined}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
    />
  );
}

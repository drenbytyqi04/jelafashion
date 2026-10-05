"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { siteImages } from "@/lib/site-images";

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/**
 * Hero video slot. Muted, looping, inline; the poster shows first (the admin's, or an
 * illustrative photo until one is uploaded). Autoplay is skipped on
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

  // Without a video from the admin, the poster (or the illustrative photo) fills the frame.
  const poster = posterUrl ?? siteImages.hero;
  if (!videoUrl) {
    return <ImagePlaceholder ratio="9/16" tint="#6B645C" className="h-full !aspect-auto" src={poster} sizes="100vw" priority position="top" />;
  }

  return (
    <video
      ref={ref}
      className="h-full w-full object-cover"
      src={play ? videoUrl : undefined}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden
    />
  );
}

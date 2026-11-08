"use client";

import { getImageProps } from "next/image";
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

  // Without a video from the admin, the poster fills the frame. With no poster either, the
  // illustrative photo is art-directed: a portrait frame for phones, a landscape one from
  // 1024px, so the desktop hero is never a blown-up crop of a vertical image.
  const poster = posterUrl ?? siteImages.hero;
  if (!videoUrl) {
    if (posterUrl) {
      return <ImagePlaceholder ratio="9/16" tint="#6B645C" className="h-full !aspect-auto" src={posterUrl} sizes="100vw" priority position="top" />;
    }
    return <HeroPicture />;
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

/** Phone and desktop frames of the illustrative hero; eager and high priority (it is the LCP). */
function HeroPicture() {
  const common = { alt: "", sizes: "100vw", quality: 75 };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, src: siteImages.heroWide, width: 2400, height: 1600 });
  const {
    props: { srcSet: tall, ...rest },
  } = getImageProps({ ...common, src: siteImages.hero, width: 1200, height: 1800 });
  return (
    <picture>
      <source media="(min-width: 64rem)" srcSet={wide} />
      <img
        {...rest}
        alt=""
        srcSet={tall}
        loading="eager"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[50%_30%] lg:object-center"
      />
    </picture>
  );
}

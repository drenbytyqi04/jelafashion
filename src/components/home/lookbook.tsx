"use client";

import { useLenis } from "lenis/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";

const FRAMES = ["#EDE3D6", "#5C534C", "#EBD3CB", "#D9C3A0", "#1F4A3D", "#F4EDE1"];

/**
 * Desktop (≥1024px, motion allowed): the section pins and the strip scrolls sideways.
 * Otherwise a native swipe row with snap points. GSAP loads only when it will be used.
 */
export function Lookbook() {
  const t = useTranslations("homeSections");
  const section = useRef<HTMLElement>(null);
  const strip = useRef<HTMLUListElement>(null);
  const refresh = useRef<(() => void) | null>(null);

  // Keep ScrollTrigger in step with Lenis' smoothed scroll position.
  useLenis(() => refresh.current?.());

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem) and (prefers-reduced-motion: no-preference)");
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    async function setup() {
      cleanup?.();
      cleanup = undefined;
      if (!mq.matches || !section.current || !strip.current) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const el = strip.current;
      const distance = () => el.scrollWidth - window.innerWidth;
      const ctx = gsap.context(() => {
        gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      }, section);
      refresh.current = ScrollTrigger.update;
      cleanup = () => {
        refresh.current = null;
        ctx.revert();
      };
    }

    void setup();
    mq.addEventListener("change", setup);
    return () => {
      cancelled = true;
      mq.removeEventListener("change", setup);
      cleanup?.();
    };
  }, []);

  return (
    <section ref={section} aria-labelledby="lookbook-title" className="overflow-hidden bg-ivory lg:flex lg:h-svh lg:flex-col lg:justify-center">
      <div className="container-page mb-8 flex items-end justify-between gap-6 lg:mb-10">
        <h2 id="lookbook-title" className="font-serif text-h2">
          {t("lookbookTitle")}
        </h2>
        <p className="hidden max-w-xs text-small text-stone md:block">{t("lookbookText")}</p>
      </div>
      <ul
        ref={strip}
        // Scrollable on touch layouts: focusable so keyboard users can scroll it too.
        tabIndex={0}
        aria-labelledby="lookbook-title"
        data-lenis-prevent-horizontal
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--gutter) pb-2 [scrollbar-width:none] lg:w-max lg:snap-none lg:gap-6 lg:overflow-visible lg:will-change-transform"
      >
        {FRAMES.map((tint, i) => (
          <li
            key={i}
            className={
              i % 2 === 1
                ? "w-[70%] shrink-0 snap-center lg:mt-16 lg:w-[26vw]"
                : "w-[70%] shrink-0 snap-center lg:w-[30vw]"
            }
          >
            <ImagePlaceholder ratio="3/4" tint={tint} pose={i % 2 ? "back" : "front"} />
          </li>
        ))}
      </ul>
    </section>
  );
}

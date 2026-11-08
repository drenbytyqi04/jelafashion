"use client";

import "lenis/dist/lenis.css";
import { ReactLenis } from "lenis/react";
import { MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, type ReactNode } from "react";
import { MotionFeatures } from "./motion-features";

/**
 * Smooth scrolling (Lenis) and global motion settings.
 * Lenis stays mounted so the tree never re-parents; with reduced motion it scrolls natively.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion() ?? false;
  // Hydrated: the head script's reveal fallback stands down (see reveal-safety.ts).
  useEffect(() => {
    window.__jfHydrated = true;
  }, []);
  return (
    <MotionConfig reducedMotion="user">
      <MotionFeatures>
        <ReactLenis
          root
          options={{ lerp: 0.09, smoothWheel: !reduce, anchors: { offset: -96 } }}
        >
          {children}
        </ReactLenis>
      </MotionFeatures>
    </MotionConfig>
  );
}

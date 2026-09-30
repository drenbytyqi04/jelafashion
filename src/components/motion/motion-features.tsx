"use client";

import { domAnimation, LazyMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Loads only the animation features the site uses (no drag or layout animation), so every
 * page ships a fraction of the motion library. `strict` makes a stray `motion.*` import an
 * error: components use `m.*`.
 */
export function MotionFeatures({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}

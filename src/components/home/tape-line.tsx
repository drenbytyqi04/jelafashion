"use client";

import { m, useScroll, useSpring } from "motion/react";
import { useRef } from "react";
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe";

/** A 1px champagne line that draws down beside the steps as they scroll into view. */
export function TapeLine() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <div ref={ref} aria-hidden className="absolute bottom-0 left-0 top-1 w-px bg-hairline">
      <m.div
        className="h-full w-full origin-top bg-champagne"
        style={reduce ? { scaleY: 1 } : { scaleY }}
      />
    </div>
  );
}

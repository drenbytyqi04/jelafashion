"use client";

import { m } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { duration, ease } from "@/lib/motion";
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe";

/** Clip-path reveal from the bottom edge with a slight settle of the image inside. */
export function RevealImage({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotionSafe();

  if (reduce) {
    return (
      <m.div
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: duration.micro }}
      >
        {children}
      </m.div>
    );
  }

  return (
    <m.div
      className={cn("overflow-hidden", className)}
      initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: duration.cinematic, ease: ease.curtain }}
    >
      <m.div
        initial={{ scale: 1.08 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: duration.cinematic + 0.4, ease: ease.couture }}
      >
        {children}
      </m.div>
    </m.div>
  );
}

"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import { duration, ease, staggerFor } from "@/lib/motion";

type Props = {
  /** One entry per designed line. Lines may still wrap on narrow screens; each stays masked. */
  lines: string[];
  as?: ElementType;
  className?: string;
  /** Start delay in seconds (e.g. to follow the intro loader). */
  delay?: number;
  /** Animate on page load (CSS, works before hydration) instead of when scrolled into view. */
  immediate?: boolean;
};

/** Masked line-by-line headline reveal. Reduced motion: a short fade. */
export function RevealText({ lines, as: Tag = "h2", className, delay = 0, immediate }: Props) {
  const reduce = useReducedMotion();
  const each = staggerFor(lines.length);

  const line: Variants = reduce
    ? { hidden: { opacity: 0 }, shown: { opacity: 1, transition: { duration: duration.micro, delay } } }
    : {
        hidden: { y: "105%" },
        shown: (i: number) => ({
          y: "0%",
          transition: { duration: duration.reveal, ease: ease.couture, delay: delay + i * each },
        }),
      };

  if (immediate) {
    // Pure CSS so above-the-fold headlines animate before hydration and never stay hidden.
    // --intro-delay (set on the home hero) holds the reveal until the intro curtain lifts.
    return (
      <Tag className={cn(className)}>
        {lines.map((text, i) => (
          <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
            <span
              className="reveal-line block"
              style={{ animationDelay: `calc(var(--intro-delay, 0s) + ${delay + i * each}s)` }}
            >
              {text}
              {i < lines.length - 1 ? " " : null}
            </span>
          </span>
        ))}
      </Tag>
    );
  }

  const trigger = {
    initial: "hidden",
    whileInView: "shown",
    viewport: { once: true, margin: "0px 0px -15% 0px" },
  };

  return (
    <Tag className={cn(className)}>
      {lines.map((text, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span className="block will-change-transform" variants={line} custom={i} {...trigger}>
            {text}
            {i < lines.length - 1 ? " " : null}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

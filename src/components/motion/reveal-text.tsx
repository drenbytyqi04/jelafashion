"use client";

import { motion, type Variants } from "motion/react";
import { cn } from "@/lib/cn";
import { duration, ease, staggerFor } from "@/lib/motion";
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe";

const MOTION_TAGS = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p } as const;
type Tag = keyof typeof MOTION_TAGS;

type Props = {
  /** One entry per designed line. Lines may still wrap on narrow screens; each stays masked. */
  lines: string[];
  as?: Tag;
  id?: string;
  className?: string;
  /** Start delay in seconds (e.g. to follow the intro loader). */
  delay?: number;
  /** Animate on page load (CSS, works before hydration) instead of when scrolled into view. */
  immediate?: boolean;
};

/** Masked line-by-line headline reveal. Reduced motion: a short fade. */
export function RevealText({ lines, as: Tag = "h2", id, className, delay = 0, immediate }: Props) {
  const MotionTag = MOTION_TAGS[Tag];
  const reduce = useReducedMotionSafe();
  const each = staggerFor(lines.length);

  const line: Variants = reduce
    ? // y is reset too: the preference can arrive after the line mounted translated.
      { hidden: { opacity: 0, y: "0%" }, shown: { opacity: 1, y: "0%", transition: { duration: duration.micro, delay } } }
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
      <Tag id={id} className={cn(className)}>
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

  // The heading observes the viewport and drives its lines through variants. A line
  // can't observe itself: while hidden it sits inside its clipping mask, which the
  // IntersectionObserver reports as never visible.
  return (
    <MotionTag
      id={id}
      className={cn(className)}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
    >
      {lines.map((text, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span className="block will-change-transform" variants={line} custom={i}>
            {text}
            {i < lines.length - 1 ? " " : null}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

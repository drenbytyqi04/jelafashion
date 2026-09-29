"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe";

/**
 * Moves its child up to `amount` percent against the scroll. Desktop only (≥1024px),
 * off with reduced motion. The frame clips, so the child is scaled to cover the travel.
 */
export function Parallax({
  children,
  amount = 8,
  className,
}: {
  children: ReactNode;
  amount?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();
  const [desktop, setDesktop] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 64rem)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active = desktop && !reduce;

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div style={active ? { y, scale: 1 + (amount * 2) / 100 } : undefined} className="h-full w-full">
        {children}
      </motion.div>
    </div>
  );
}

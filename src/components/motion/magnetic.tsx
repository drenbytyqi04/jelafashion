"use client";

import { m, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

const MAX_PULL = 6;

/** Pulls its child up to 6px toward the pointer. Desktop fine pointers only. */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const x = useSpring(useMotionValue(0), { stiffness: 180, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 180, damping: 18, mass: 0.4 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 64rem)");
    const update = () => setEnabled(mq.matches && !reduce);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduce]);

  function onMove(e: PointerEvent<HTMLSpanElement>) {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    x.set(Math.max(-1, Math.min(1, dx)) * MAX_PULL);
    y.set(Math.max(-1, Math.min(1, dy)) * MAX_PULL);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <m.span
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x, y, display: "inline-flex" }}
      className={className}
    >
      {children}
    </m.span>
  );
}

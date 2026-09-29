"use client";

import { useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * `useReducedMotion`, but false during server render and hydration so markup always
 * matches; the real preference applies right after. Components using it must reach the
 * same final visual state either way.
 */
export function useReducedMotionSafe(): boolean {
  const reduce = useReducedMotion();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  return hydrated ? !!reduce : false;
}

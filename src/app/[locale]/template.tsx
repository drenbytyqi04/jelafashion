"use client";

import { useEffect, useState, type ReactNode } from "react";

declare global {
  interface Window {
    __jfNavigated?: boolean;
  }
}

/**
 * Fade + slight rise on client-side navigation only. The first load is left alone so the
 * largest paint is never delayed by an entrance animation.
 */
export default function Template({ children }: { children: ReactNode }) {
  const [animate] = useState(() => typeof window !== "undefined" && window.__jfNavigated === true);
  useEffect(() => {
    window.__jfNavigated = true;
  }, []);
  return <div className={animate ? "page-enter" : undefined}>{children}</div>;
}

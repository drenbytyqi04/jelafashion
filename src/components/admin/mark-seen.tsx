"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { markOrderSeen } from "@/app/actions/admin-orders";

/**
 * Marks the order as opened once it is actually on screen (not on link prefetch), then
 * refreshes so the menu badge drops by one.
 */
export function MarkSeen({ orderId, seen }: { orderId: string; seen: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (seen) return;
    markOrderSeen(orderId).then(() => router.refresh());
  }, [orderId, seen, router]);
  return null;
}

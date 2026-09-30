"use client";

import { useEffect } from "react";
import { reportPurchase } from "@/app/actions/tracking";
import { track, type TrackItem } from "@/lib/tracking/track";
import { useConsentStore } from "@/stores/consent";

const KEY = "jf-tracked-purchases";

/** Fires the purchase once per order and device, after consent is known. */
export function PurchaseTracker({
  token,
  orderNumber,
  eventId,
  items,
  value,
  shipping,
  final,
}: {
  token: string;
  orderNumber: string;
  eventId: string;
  items: TrackItem[];
  value: number;
  shipping: number;
  final: boolean;
}) {
  const decided = useConsentStore((s) => s.decidedAt);
  const marketing = useConsentStore((s) => s.marketing);

  useEffect(() => {
    if (!final || !decided) return;
    let done: string[] = [];
    try {
      done = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {}
    if (done.includes(orderNumber)) return;
    track({ name: "purchase", orderNumber, items, value, shipping, eventId });
    if (marketing) void reportPurchase({ token, url: window.location.origin + window.location.pathname });
    try {
      localStorage.setItem(KEY, JSON.stringify([...done, orderNumber].slice(-50)));
    } catch {}
  }, [final, decided, marketing, orderNumber, items, value, shipping, eventId, token]);

  return null;
}

import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { localDataEnabled } from "@/lib/local-db";
import { serviceSupabase } from "@/lib/supabase/service-client";

/**
 * Per-address limits for public Server Actions, so no form can be used to flood the
 * atelier's inbox, someone else's inbox, or the order book. Counted in Postgres
 * (`hit_rate_limit`) so every serverless instance shares them; without a service key, in
 * memory. The address is hashed before it is stored.
 *
 * Fails open: if the counter itself is unreachable the request goes through (and is
 * logged), because turning a customer away is worse than one unmetered request.
 */
export const LIMITS = {
  contact: { limit: 5, windowSeconds: 3600 },
  newsletter: { limit: 10, windowSeconds: 3600 },
  signInLink: { limit: 5, windowSeconds: 900 },
  discount: { limit: 20, windowSeconds: 600 },
  order: { limit: 10, windowSeconds: 600 },
  proof: { limit: 20, windowSeconds: 3600 },
  purchaseReport: { limit: 30, windowSeconds: 600 },
} as const;

export type RateLimitAction = keyof typeof LIMITS;

const memory = new Map<string, { start: number; hits: number }>();

async function clientKey(action: RateLimitAction): Promise<string> {
  const h = await headers();
  // Vercel sets x-real-ip; x-forwarded-for's first entry is the client elsewhere.
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${action}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`;
}

/** True when the caller may go ahead; counts this call. */
export async function withinRateLimit(action: RateLimitAction): Promise<boolean> {
  const { limit, windowSeconds } = LIMITS[action];
  const key = await clientKey(action);

  const db = serviceSupabase();
  if (db) {
    const { data, error } = await db.rpc("hit_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: windowSeconds });
    if (error) {
      console.error("[rate-limit] counter unavailable", error.message);
      return true;
    }
    if (data === false) console.warn(`[rate-limit] ${action} limit reached`);
    return data !== false;
  }

  // Local development and the QA suites (which place many orders quickly) run unmetered
  // unless JF_RATE_LIMIT=1 asks for the in-memory counter.
  if (localDataEnabled() && process.env.JF_RATE_LIMIT !== "1") return true;
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now - entry.start > windowSeconds * 1000) {
    memory.set(key, { start: now, hits: 1 });
    return true;
  }
  entry.hits += 1;
  return entry.hits <= limit;
}

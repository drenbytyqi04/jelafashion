import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * Service-role client: bypasses Row Level Security, so it only ever runs on the server,
 * after the caller has validated input and checked access (e.g. an order's access token).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY isn't set.
 */
export function serviceSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // New secret keys (sb_secret_…) and the legacy service_role JWT both work here.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

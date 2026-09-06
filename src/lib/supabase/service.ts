import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client using the service_role key.
 * Bypasses RLS. NEVER import this into client components or expose to the browser.
 */
export function getServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Service role client is not configured.");
  }
  return createSupabaseClient(url, key);
}

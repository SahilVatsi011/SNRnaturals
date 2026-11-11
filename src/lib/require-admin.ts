import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-auth";

export type AdminAuthResult =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getUser>>> }
  | { ok: false; error: string };

async function getUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Guard for every admin server action. Returns the authenticated user when the
 * caller is an admin, otherwise an error message safe to surface in the UI.
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Unauthorized. Please log in again." };
  if (!isAdminUser(user)) {
    return { ok: false, error: "Not authorized. Admin access required." };
  }
  return { ok: true, user };
}

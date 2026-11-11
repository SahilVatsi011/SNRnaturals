/**
 * Admin authorisation helpers (pure — safe to import from middleware).
 *
 * The `authenticated` Supabase role currently has full read/write access to every
 * table (see supabase/migrations/0001_init.sql — "authenticated full products"
 * and friends). That is fine while the only account is the owner, but as soon as
 * storefront customers get their own logins, every signed-in customer would be
 * able to edit or delete products and read every order. Admin surfaces must
 * therefore check the role explicitly instead of only checking that *some* user
 * is logged in.
 *
 * A user is an admin when either:
 *   - their `app_metadata.role` is "admin" (set once via the Supabase admin API), or
 *   - their email is listed in the ADMIN_EMAILS env var (comma separated).
 */

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
} | null | undefined): boolean {
  if (!user) return false;
  if (user.app_metadata?.role === "admin") return true;
  if (user.app_metadata?.is_admin === true) return true;
  const email = (user.email ?? "").trim().toLowerCase();
  if (!email) return false;
  return getAdminEmails().includes(email);
}

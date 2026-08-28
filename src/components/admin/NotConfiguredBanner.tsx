export default function NotConfiguredBanner() {
  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
      <strong>Supabase not configured yet.</strong>
      <p className="mt-1">
        To enable the admin panel and data, add your{" "}
        <code className="rounded bg-amber-100 px-1">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-amber-100 px-1">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to <code>.env.local</code>, run the SQL migrations in{" "}
        <code>supabase/migrations/</code>, and create an admin user. See{" "}
        <code>supabase/README.md</code>.
      </p>
    </div>
  );
}

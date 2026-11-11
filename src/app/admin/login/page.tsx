import { login } from "../auth-actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { STORE } from "@/lib/constants";
import { LogoMark } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-700">
            <LogoMark className="h-9 text-white" />
          </span>
          <h1 className="text-xl font-bold text-stone-800">SNR Naturals</h1>
          <p className="text-sm text-stone-500">
            {STORE.name} — Admin Panel
          </p>
        </div>

        <SearchParamsError error={sp.error} />

        <form action={login} className="space-y-4">
          {sp.next ? <input type="hidden" name="next" value={sp.next} /> : null}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@snrnaturalsfpc.com"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          <Button type="submit" size="lg" className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
async function SearchParamsError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {error}
    </div>
  );
}

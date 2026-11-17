import { LogoMark } from "@/components/Logo";

/** Centred brand loader for pages that don't have a shaped skeleton. */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 px-4" role="status" aria-live="polite">
      <span className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-[3px] border-brand-100" />
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-brand-700" />
        <LogoMark className="h-7 animate-pulse text-brand-700" />
      </span>
      <p className="text-sm font-medium text-stone-500">{label}</p>
    </div>
  );
}

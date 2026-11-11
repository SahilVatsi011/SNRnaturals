import { STORE } from "@/lib/constants";

/**
 * SNR Naturals logo (hand + leaves).
 *
 * The mark is rendered as a CSS mask filled with `currentColor`, so it always
 * takes the text colour of wherever it is placed: green on light backgrounds,
 * white on dark/green backgrounds. Set the colour with a text-* class, e.g.
 *   <LogoMark className="h-8 text-brand-700" />   // light bg
 *   <LogoMark className="h-8 text-white" />       // dark bg
 */
export function LogoMark({ className = "h-8" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${STORE.name} logo`}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        aspectRatio: "521 / 642",
        WebkitMaskImage: "url(/brand/logo-mark.png)",
        maskImage: "url(/brand/logo-mark.png)",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

/** Mark + "SNR Naturals" wordmark, both in the current text colour. */
export function Logo({
  className = "",
  markClassName = "h-8",
  textClassName = "text-lg",
  subtitle,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  subtitle?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight ${textClassName}`}>SNR Naturals</span>
        {subtitle && (
          <span className="mt-1 text-[11px] font-medium opacity-60">{subtitle}</span>
        )}
      </span>
    </span>
  );
}

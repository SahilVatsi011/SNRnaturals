import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink hover:bg-brand-800 active:bg-brand-900 text-white shadow-sm disabled:bg-stone-300",
  secondary:
    "bg-white hover:bg-stone-50 text-stone-700 ring-1 ring-inset ring-stone-200 hover:ring-stone-300",
  danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:bg-red-300",
  ghost: "bg-transparent hover:bg-stone-100 text-stone-600",
};

const sizes: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-5 py-2.5 text-base",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}

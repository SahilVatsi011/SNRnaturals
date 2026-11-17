"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Text shown while the form's server action is running. */
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  /** Render a bare <button> (keeps the caller's own classes). */
  unstyled?: boolean;
};

/**
 * Submit button for `<form action={serverAction}>`: shows a spinner and
 * disables itself while the action runs, so a slow save never looks stuck.
 */
export function SubmitButton({ pendingLabel, children, unstyled, className = "", variant, size, ...props }: Props) {
  const { pending } = useFormStatus();
  const content = pending ? (
    <>
      <Spinner className="h-3.5 w-3.5" />
      {pendingLabel ?? children}
    </>
  ) : (
    children
  );

  if (unstyled) {
    return (
      <button
        type="submit"
        {...props}
        disabled={pending || props.disabled}
        aria-busy={pending}
        className={`inline-flex items-center justify-center gap-1.5 disabled:cursor-wait disabled:opacity-60 ${className}`}
      >
        {content}
      </button>
    );
  }
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={className}
    >
      {content}
    </Button>
  );
}

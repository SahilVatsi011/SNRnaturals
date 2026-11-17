"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "snr:nav-start";
/** Don't flash the bar for navigations that finish almost instantly. */
const SHOW_DELAY_MS = 120;
/** Give up if a navigation never lands (e.g. it was cancelled). */
const SAFETY_MS = 10000;

/** Start the top loading bar before a programmatic `router.push()`. */
export function startNavProgress() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(START_EVENT));
}

type Phase = "idle" | "loading" | "done";

/**
 * Thin loading bar at the very top of the screen. It appears as soon as the
 * user taps a link or submits a form and finishes when the new page is shown,
 * so slow pages never look frozen. Used by both the store and the admin panel.
 */
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const finish = useCallback(() => {
    clearTimers();
    setPhase((p) => (p === "loading" ? "done" : "idle"));
    timers.current.push(setTimeout(() => setPhase("idle"), 300));
  }, []);

  const start = useCallback(() => {
    clearTimers();
    timers.current.push(
      setTimeout(() => setPhase("loading"), SHOW_DELAY_MS),
      setTimeout(finish, SAFETY_MS)
    );
  }, [finish]);

  // The new page has rendered.
  useEffect(() => {
    const frame = requestAnimationFrame(finish);
    return () => cancelAnimationFrame(frame);
  }, [pathname, search, finish]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (or just a #section jump) — nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    }
    // Plain HTML form posts/gets (React-handled forms call preventDefault first).
    function onSubmit(e: SubmitEvent) {
      if (!e.defaultPrevented) start();
    }
    // Coming back via the browser's back/forward cache: never leave the bar stuck.
    function onPageShow() {
      clearTimers();
      setPhase("idle");
    }
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    window.addEventListener(START_EVENT, start);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit);
      window.removeEventListener(START_EVENT, start);
      window.removeEventListener("pageshow", onPageShow);
      clearTimers();
    };
  }, [start]);

  const bar =
    phase === "loading"
      ? { transform: "scaleX(0.85)", transition: "transform 8s cubic-bezier(0.1, 0.7, 0.1, 1)" }
      : phase === "done"
        ? { transform: "scaleX(1)", transition: "transform 200ms ease-out" }
        : { transform: "scaleX(0)", transition: "transform 0s 300ms" };

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-300 ${
        phase === "idle" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className="h-full origin-left bg-gradient-to-r from-brand-500 via-brand-600 to-honey-500 shadow-[0_0_8px_rgba(26,98,10,0.45)]"
        style={bar}
      />
    </div>
  );
}

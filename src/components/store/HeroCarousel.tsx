"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatINR } from "@/lib/format";

export interface HeroSlide {
  slug: string;
  name: string;
  price: number;
  image: string;
}

const AUTOPLAY_MS = 3500;
const SWIPE_PX = 40;

/**
 * Where a card sits relative to the active one: 0 = centre (featured),
 * -1 / +1 = the tilted cards either side, anything further is tucked away
 * behind the centre card. All cards share one box so moving between
 * positions is a smooth transform.
 */
function placement(offset: number): React.CSSProperties {
  if (offset === 0)
    return { transform: "translateX(-50%)", opacity: 1, zIndex: 3 };
  if (Math.abs(offset) === 1) {
    const s = offset < 0 ? -1 : 1;
    return {
      transform: `translateX(-50%) translateX(${s * 64}%) translateY(10%) rotate(${s * 9}deg) scale(0.8)`,
      opacity: 1,
      zIndex: 2,
    };
  }
  const s = offset < 0 ? -1 : 1;
  return {
    transform: `translateX(-50%) translateX(${s * 30}%) translateY(14%) scale(0.6)`,
    opacity: 0,
    zIndex: 1,
    pointerEvents: "none",
  };
}

/** Indexes within two places of `i` (wrapping): the visible cards plus the next ones in. */
function near(i: number, n: number): Set<number> {
  return new Set([-2, -1, 0, 1, 2].map((d) => (((i + d) % n) + n) % n));
}

/** Fanned product cards on the homepage hero that slide (swipe, arrows, dots, autoplay). */
export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const n = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  // Only download photos for cards that are on screen or next up, so the
  // hidden cards don't cost mobile data before anyone slides to them.
  const [loaded, setLoaded] = useState(() => near(0, n));
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);

  const select = useCallback(
    (i: number) => {
      setActive(i);
      setLoaded((s) =>
        [...near(i, n)].every((k) => s.has(k)) ? s : new Set([...s, ...near(i, n)]),
      );
    },
    [n],
  );
  const go = (dir: number) => select((active + dir + n) % n);

  useEffect(() => {
    if (n < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => select((active + 1) % n), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [n, paused, active, select]);

  if (n === 0) return null;

  // Shortest signed distance from the active card, so the loop wraps around.
  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  return (
    <div
      className="absolute inset-0 touch-pan-y select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        swiped.current = false;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > SWIPE_PX) {
          swiped.current = true;
          go(dx < 0 ? 1 : -1);
        }
      }}
      aria-roledescription="carousel"
      aria-label="Featured products"
    >
      {slides.map((p, i) => {
        const offset = offsetOf(i);
        const isActive = offset === 0;
        return (
          <Link
            key={p.slug}
            href={`/products/${p.slug}`}
            onClick={(e) => {
              // A swipe shouldn't open the product; tapping a side card brings it to the front.
              if (swiped.current) {
                e.preventDefault();
                swiped.current = false;
              } else if (!isActive) {
                e.preventDefault();
                select(i);
              }
            }}
            tabIndex={isActive ? 0 : -1}
            aria-hidden={!isActive}
            draggable={false}
            className="group absolute left-1/2 top-[3%] block w-[46%] rounded-[1.25rem] bg-white p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/5 transition-[transform,opacity] duration-500 ease-out motion-reduce:transition-none sm:p-2"
            style={placement(offset)}
          >
            <span className="relative block aspect-[4/5] overflow-hidden rounded-2xl bg-cream-100">
              {loaded.has(i) && (
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  priority={i === 0}
                  draggable={false}
                  sizes="(min-width: 1024px) 260px, 46vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
            </span>
            <span className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2">
              <span className="truncate text-xs font-medium text-ink sm:text-sm">
                {p.name}
              </span>
              <span className="shrink-0 text-xs font-bold text-brand-700 sm:text-sm">
                {formatINR(p.price)}
              </span>
            </span>
          </Link>
        );
      })}

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous product"
            className="absolute left-0 top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white sm:h-10 sm:w-10"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next product"
            className="absolute right-0 top-[38%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md ring-1 ring-black/5 backdrop-blur transition hover:bg-white sm:h-10 sm:w-10"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="absolute bottom-[3.75rem] left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {slides.map((p, i) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => select(i)}
                aria-label={`Show ${p.name}`}
                aria-current={i === active}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-5 bg-brand-700"
                    : "w-1.5 bg-ink/20 hover:bg-ink/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

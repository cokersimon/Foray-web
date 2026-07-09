"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

const DEFAULT_DURATION_MS = 5500;

/**
 * Apple-style pigmented progress dots: active index elongates into a pill that
 * fills over `durationMs`, then advances. Pauses on hover/focus and when
 * prefers-reduced-motion is set (manual tap only).
 */
export function useTimedCarousel(count: number, durationMs = DEFAULT_DURATION_MS) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const inViewRef = useRef(true);

  const goTo = useCallback((next: number) => {
    setIndex(((next % count) + count) % count);
    setProgressKey((k) => k + 1);
  }, [count]);

  const next = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  useEffect(() => {
    if (prefersReducedMotion || paused || count < 2) return;
    const id = window.setTimeout(next, durationMs);
    return () => window.clearTimeout(id);
  }, [index, paused, prefersReducedMotion, count, durationMs, next, progressKey]);

  return {
    index,
    goTo,
    next,
    paused,
    setPaused,
    progressKey,
    autoplay: !prefersReducedMotion,
    durationMs,
    inViewRef,
  };
}

export function CarouselProgress({
  count,
  index,
  onSelect,
  autoplay,
  durationMs,
  progressKey,
  className,
}: {
  count: number;
  index: number;
  onSelect: (i: number) => void;
  autoplay: boolean;
  durationMs: number;
  progressKey: number;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="Carousel slides"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {Array.from({ length: count }, (_, i) => {
        const active = i === index;
        return (
          <button
            key={`${i}-${active ? progressKey : 0}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => onSelect(i)}
            className={cn(
              "relative overflow-hidden rounded-full transition-[width,background-color] duration-300",
              active ? "h-1.5 w-7 bg-foreground/20" : "h-1.5 w-1.5 bg-foreground/25 hover:bg-foreground/40",
            )}
          >
            {active && autoplay && (
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                style={{
                  animation: `carousel-progress ${durationMs}ms linear forwards`,
                }}
              />
            )}
            {active && !autoplay && (
              <span className="absolute inset-0 rounded-full bg-foreground" />
            )}
          </button>
        );
      })}
    </div>
  );
}

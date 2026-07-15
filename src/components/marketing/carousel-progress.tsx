"use client";

import { useCallback, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

const DEFAULT_DURATION_MS = 8000;

/**
 * Apple-style pigmented progress dots: active index elongates into a pill.
 * When `autoplay` is enabled and the carousel is in view, the pill fills over
 * `durationMs` then advances. Pass `autoplay: false` for manual-only control.
 */
export function useTimedCarousel(
  count: number,
  {
    durationMs = DEFAULT_DURATION_MS,
    inView = false,
    autoplay: autoplayEnabled = true,
  }: { durationMs?: number; inView?: boolean; autoplay?: boolean } = {},
) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      setProgressKey((k) => k + 1);
    },
    [count],
  );

  const next = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const canAutoplay =
    autoplayEnabled &&
    Boolean(inView) &&
    !prefersReducedMotion &&
    !paused &&
    count >= 2;

  useEffect(() => {
    if (!canAutoplay) return;
    const id = window.setTimeout(next, durationMs);
    return () => window.clearTimeout(id);
  }, [canAutoplay, durationMs, next, progressKey]);

  return {
    index,
    goTo,
    next,
    paused,
    setPaused,
    progressKey,
    autoplay: canAutoplay,
    durationMs,
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
            className="-my-1 flex h-6 min-w-6 items-center justify-center"
          >
            <span
              className={cn(
                "relative overflow-hidden rounded-full transition-[width,background-color] duration-500 ease-out",
                active
                  ? "h-1.5 w-8 bg-foreground/15"
                  : "h-1.5 w-1.5 bg-foreground/25 hover:bg-foreground/40",
              )}
            >
              {active && autoplay && (
                <span
                  key={`fill-${progressKey}-on`}
                  className="absolute inset-y-0 left-0 rounded-full bg-foreground"
                  style={{
                    animation: `carousel-progress ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                  }}
                />
              )}
              {active && !autoplay && (
                <span className="absolute inset-0 rounded-full bg-foreground" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

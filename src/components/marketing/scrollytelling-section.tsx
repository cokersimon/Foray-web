"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ForayIcon } from "@/components/brand/foray-icon";
import { ProductPhone, type ProductScreen } from "./product-phone";
import { cn } from "@/lib/cn";

interface Step {
  number: string;
  label: string;
  body: string;
  screen: ProductScreen;
}

const STEPS: Step[] = [
  {
    number: "01",
    label: "Bring the recipe",
    body: "Share or paste a link from TikTok, Instagram or a food blog. Foray turns it into clear ingredients and steps.",
    screen: "recipes",
  },
  {
    number: "02",
    label: "Choose without overthinking",
    body: "Browse a small set that fits your time and tastes, then fork the one that sounds good.",
    screen: "swipe",
  },
  {
    number: "03",
    label: "One accurate shop",
    body: "Quantities are scaled, duplicates combined and the list sorted by aisle, ready for online checkout or in-store.",
    screen: "groceries",
  },
  {
    number: "04",
    label: "Get dinner on",
    body: "Clear steps and timers stay beside the hob, so you can cook without juggling apps.",
    screen: "cook",
  },
];

export function ScrollytellingSection() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const step = STEPS[index];
  const atStart = index === 0;
  const atEnd = index === STEPS.length - 1;

  function goTo(next: number) {
    setIndex(Math.max(0, Math.min(STEPS.length - 1, next)));
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    goTo(index + (dx < 0 ? 1 : -1));
  }

  return (
    <section
      id="how-it-works"
      className="bg-section-grey text-foreground"
    >
      <div className="mx-auto max-w-3xl px-5 py-20 sm:px-6 md:py-28 lg:py-32">
        <div
          className="flex flex-col items-center text-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <h2 className="text-balance text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.04em]">
                <span className="tabular-nums">{step.number}</span>
                <span className="text-brand-dot">.</span>{" "}
                {step.label}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-muted sm:text-lg">
                {step.body}
              </p>
              <div className="mt-10 flex items-center justify-center gap-3 sm:gap-5">
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  disabled={atStart}
                  aria-label="Previous step"
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/55 transition-colors",
                    atStart
                      ? "cursor-default opacity-30"
                      : "hover:bg-black/[0.06] hover:text-foreground",
                  )}
                >
                  <ForayIcon name="arrowLeft" size="small" />
                </button>
                <ProductPhone
                  screen={step.screen}
                  className="w-[230px] sm:w-[260px] lg:w-[278px]"
                />
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  disabled={atEnd}
                  aria-label="Next step"
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/55 transition-colors",
                    atEnd
                      ? "cursor-default opacity-30"
                      : "hover:bg-black/[0.06] hover:text-foreground",
                  )}
                >
                  <ForayIcon name="arrowRight" size="small" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

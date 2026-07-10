"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SfSymbol } from "@/components/brand/sf-symbol";
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
    label: "Choose a recipe",
    body: "Browse Foray recipes, or import from TikTok, Instagram or a food blog.",
    screen: "recipes",
  },
  {
    number: "02",
    label: "Grocery list",
    body: "Quantities scale to your household. The list is combined and sorted by aisle.",
    screen: "groceries",
  },
  {
    number: "03",
    label: "Shop in person",
    body: "Take the aisle-sorted list into the store and tick items off as you go.",
    screen: "instore",
  },
  {
    number: "04",
    label: "Shop online",
    body: "Foray fills your supermarket basket. Review, then check out as usual.",
    screen: "online",
  },
  {
    number: "05",
    label: "Cooking",
    body: "Clear steps and timers stay beside the hob so you can cook hands-free.",
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
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="mx-auto max-w-3xl px-5 pt-20 sm:px-6 md:pt-28 lg:pt-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={`copy-${step.number}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <h2 className="text-balance text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.04em]">
              <span className="tabular-nums">{step.number}</span>
              <span className="text-brand-dot">.</span>{" "}
              {step.label}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty text-base leading-relaxed text-muted sm:text-lg">
              {step.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/*
        Phone stays dead-centre. On lg+, side columns are equal (1fr) so each
        glass control sits in the middle of the gutter between the phone and
        the viewport edge. Mobile keeps tight plain chevrons beside the phone.
      */}
      <div className="mx-auto w-full px-5 pb-20 pt-10 sm:px-6 md:pb-28 lg:px-0 lg:pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={`stage-${step.number}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "flex w-full items-center justify-center gap-3 sm:gap-5",
              "lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-0",
            )}
          >
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={atStart}
                aria-label="Previous step"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/55 lg:hidden",
                  atStart
                    ? "cursor-default opacity-30"
                    : "hover:bg-black/[0.06] hover:text-foreground",
                )}
              >
                <SfSymbol name="chevronLeft" size="small" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index - 1)}
                disabled={atStart}
                aria-label="Previous step"
                className={cn(
                  "glass-chip-clear relative hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center lg:flex",
                  atStart && "pointer-events-none cursor-default opacity-35",
                )}
              >
                <SfSymbol name="chevronLeft" size="small" />
              </button>
            </div>

            <ProductPhone
              screen={step.screen}
              className="w-[230px] sm:w-[260px] lg:w-[278px]"
            />

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={atEnd}
                aria-label="Next step"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/55 lg:hidden",
                  atEnd
                    ? "cursor-default opacity-30"
                    : "hover:bg-black/[0.06] hover:text-foreground",
                )}
              >
                <SfSymbol name="chevronRight" size="small" />
              </button>
              <button
                type="button"
                onClick={() => goTo(index + 1)}
                disabled={atEnd}
                aria-label="Next step"
                className={cn(
                  "glass-chip-clear relative hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center lg:flex",
                  atEnd && "pointer-events-none cursor-default opacity-35",
                )}
              >
                <SfSymbol name="chevronRight" size="small" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

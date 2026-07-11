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
    screen: "step-import",
  },
  {
    number: "02",
    label: "Grocery list",
    body: "Quantities scale to your household. The list is combined and sorted by aisle.",
    screen: "step-groceries",
  },
  {
    number: "03",
    label: "Shop in person",
    body: "Take the aisle-sorted list into the store and tick items off as you go.",
    screen: "step-instore",
  },
  {
    number: "04",
    label: "Shop online",
    body: "Foray fills your supermarket basket. Review, then check out as usual.",
    screen: "step-online",
  },
  {
    number: "05",
    label: "Cooking",
    body: "Clear steps and timers stay beside the hob so you can cook hands-free.",
    screen: "step-cook",
  },
];

function StepControl({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  const label = isPrev ? "Previous step" : "Next step";
  const icon = isPrev ? "chevronLeft" : "chevronRight";

  return (
    <>
      {/* Mobile — plain chevron beside the phone */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/55 lg:hidden",
          disabled
            ? "cursor-default opacity-30"
            : "hover:bg-black/[0.06] hover:text-foreground",
        )}
      >
        <SfSymbol name={icon} size="small" />
      </button>
      {/* Desktop — liquid-glass chip beside the phone */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "glass-chip-clear relative hidden h-10 w-10 shrink-0 cursor-pointer items-center justify-center lg:flex",
          disabled && "pointer-events-none cursor-default opacity-35",
        )}
      >
        <SfSymbol name={icon} size="small" />
      </button>
    </>
  );
}

export function ScrollytellingSection() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const step = STEPS[index]!;
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
    const dx =
      (e.changedTouches[0]?.clientX ?? touchStartX.current) -
      touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 48) return;
    goTo(index + (dx < 0 ? 1 : -1));
  }

  return (
    <section id="how-it-works" className="bg-section-grey text-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-6 md:py-28 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:px-10 lg:py-32">
        {/* Left — fixed context. Mobile: title only. Desktop: eyebrow + title + subtitle. */}
        <div className="max-w-xl text-center lg:text-left">
          <p className="hidden text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-dot sm:text-xs lg:block">
            The Foray experience
          </p>
          <h2 className="text-balance text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-[-0.045em] lg:mt-4">
            <span className="lg:hidden">
              The Foray experience
              <span className="text-brand-dot">.</span>
            </span>
            <span className="hidden lg:inline">
              Your week on autoplay
              <span className="text-brand-dot">.</span>
            </span>
          </h2>
          <p className="mx-auto mt-5 hidden max-w-md text-pretty text-base leading-relaxed text-muted sm:text-lg lg:mx-0 lg:block">
            Five steps, one app. Here&apos;s how a week with Foray actually runs.
          </p>
        </div>

        {/* Right — step copy, then phone with controls immediately beside it */}
        <div
          className="relative flex flex-col items-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-full max-w-md text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step.number}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3 className="text-balance text-[clamp(1.35rem,2.6vw,1.9rem)] font-bold leading-[1.15] tracking-[-0.03em]">
                  <span className="tabular-nums">{step.number}</span>
                  <span className="text-brand-dot">.</span>{" "}
                  {step.label}
                </h3>
                <p className="mx-auto mt-3 max-w-sm text-pretty text-base leading-relaxed text-muted">
                  {step.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 flex w-full items-center justify-center gap-3 sm:mt-10 sm:gap-5">
            <StepControl
              direction="prev"
              disabled={atStart}
              onClick={() => goTo(index - 1)}
            />
            <ProductPhone
              screen={step.screen}
              className="w-[230px] sm:w-[260px] md:w-[270px] lg:w-[278px]"
            />
            <StepControl
              direction="next"
              disabled={atEnd}
              onClick={() => goTo(index + 1)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

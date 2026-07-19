"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { CarouselProgress, useTimedCarousel } from "./carousel-progress";
import { cn } from "@/lib/cn";

const PROPS = [
  {
    image: "/brand/feature-household.png",
    title: "Shop for the whole household.",
    body: "Set servings once. Every list scales for kids, visitors, or whoever is eating that week.",
    band: "bg-[#ff9500]",
  },
  {
    image: "/brand/feature-pantry-camera.png",
    title: "Snap your pantry. Get a recipe.",
    body: "Take a photo of what you already have. Foray turns it into a recipe you can cook tonight.",
    band: "bg-[#30b0c7]",
    // 10% down from previous 1.28 boost
    artScale: "scale-[1.15]",
  },
  {
    image: "/brand/feature-create-notepad.png",
    title: "Make it yours.",
    body: "Create recipes from scratch, or turn a photo or screenshot into ingredients and steps you can edit.",
    band: "bg-[#5856d6]",
    // 10% down from previous 1.12 boost
    artScale: "scale-[1.01]",
  },
  {
    image: "/brand/feature-chef-siri.png",
    title: "Ask Chef. Talk to Siri.",
    body: "Chef AI builds a recipe from whatever you fancy. Siri can help when your hands are full.",
    band: "bg-[#007aff]",
  },
];

const SCROLL_SETTLE_MS = 500;

export function ValueProps() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);
  /** When true, index changed from user scroll — don't fight with a scrollTo. */
  const indexFromScroll = useRef(false);

  const { index, goTo, progressKey, durationMs } = useTimedCarousel(
    PROPS.length,
    { autoplay: false },
  );

  useEffect(() => {
    if (indexFromScroll.current) {
      indexFromScroll.current = false;
      return;
    }
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelectorAll<HTMLElement>("[data-outcome-card]")[index];
    if (!card) return;
    programmaticScroll.current = true;
    const left = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
    el.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
    const id = window.setTimeout(() => {
      programmaticScroll.current = false;
    }, SCROLL_SETTLE_MS);
    return () => window.clearTimeout(id);
  }, [index]);

  function onScroll() {
    if (programmaticScroll.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>("[data-outcome-card]")];
    if (!cards.length) return;
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((card, i) => {
      const center = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - mid);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    if (best !== index) {
      indexFromScroll.current = true;
      goTo(best);
    }
  }

  function selectDot(i: number) {
    indexFromScroll.current = false;
    goTo(i);
  }

  return (
    <section
      ref={sectionRef}
      className="bg-background py-[clamp(5rem,2.9375rem+8.5vw,8rem)]"
    >
      {/*
        Match Pricing inset exactly: horizontal padding on a wrapper around
        a bare max-w-7xl (not padding inside the max-width box).
      */}
      <div className="px-(--gutter)">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
              Built for how you actually cook
              <span className="text-brand-dot">.</span>
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">
              Because real life doesn’t follow a rigid recipe. From scaling
              dinner for a chaotic full house to turning random fridge leftovers
              into gourmet meals, Foray handles all the messy details.
            </p>
          </div>
        </div>
      </div>

      {/*
        Full-width scroller (no section padding) so cards can peek to the
        viewport edge. Padding uses the same --gutter as section titles:
        max(gutter, (sectionWidth - 80rem) / 2).
        No scroll-smooth here — native snap feels better for swipe; dots still
        use smooth scrollTo.
      */}
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={cn(
          "scrollbar-hide mt-12 flex w-full snap-x snap-mandatory gap-5 overflow-x-auto pb-10 pt-4",
          "pl-[max(var(--gutter),calc((100%-80rem)/2))] pr-[max(var(--gutter),calc((100%-80rem)/2))]",
        )}
      >
        {PROPS.map((prop) => (
          <article
            key={prop.title}
            data-outcome-card
            className="relative w-[min(86vw,clamp(21.25rem,21.667rem+5.208vw,25rem))] shrink-0 snap-center rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          >
            {/* Rounded face clips content; shadow lives on the article so it isn't cut off. */}
            <div className="flex h-full flex-col overflow-hidden rounded-[28px] bg-white">
              <div className={cn("flex flex-1 flex-col p-7 text-white sm:p-8", prop.band)}>
                <h3 className="text-balance text-2xl font-bold leading-tight tracking-[-0.03em] sm:text-[1.7rem]">
                  {prop.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-[15px]">
                  {prop.body}
                </p>
              </div>
              <div className="relative mt-auto h-56 overflow-hidden bg-white sm:h-64">
                <Image
                  src={prop.image}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="400px"
                  className={cn(
                    "origin-center object-contain p-3 sm:p-4",
                    // Camera + notepad: true vertical centre in the white well.
                    // Orange + apple sit naturally with object-bottom.
                    "artScale" in prop
                      ? cn("object-center", prop.artScale)
                      : "object-bottom",
                  )}
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="px-(--gutter)">
        <div className="mx-auto max-w-7xl">
          <CarouselProgress
            count={PROPS.length}
            index={index}
            onSelect={selectDot}
            autoplay={false}
            durationMs={durationMs}
            progressKey={progressKey}
            className="mt-8"
          />
        </div>
      </div>
    </section>
  );
}

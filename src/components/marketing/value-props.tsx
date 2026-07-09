"use client";

import { useRef } from "react";
import Image from "next/image";
import { ForayIcon } from "@/components/brand/foray-icon";

const PROPS = [
  {
    image: "/brand/foray-kitchen-objects.png",
    imageClass: "object-cover object-[18%_42%] scale-[1.35]",
    label: "Sunday reset",
    title: "When nothing sounds obvious.",
    body: "Start with a small set that fits your time and tastes. Swipe past what you do not fancy and keep the one that you do.",
  },
  {
    image: "/brand/foray-kitchen-objects.png",
    imageClass: "object-cover object-[72%_48%] scale-[1.4]",
    label: "Midweek scramble",
    title: "When your head is already full.",
    body: "Let the grocery list remember the quantities, duplicates and aisles. Add everyday essentials to the same shop.",
  },
  {
    image: "/brand/foray-kitchen-objects.png",
    imageClass: "object-cover object-[48%_28%] scale-[1.45]",
    label: "Dinner, now",
    title: "When dinner needs to happen.",
    body: "Open the meal, follow one clear step at a time and set named timers without leaving cook mode.",
  },
];

export function ValueProps() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-outcome-card]");
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <section className="bg-background px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-[13px] font-semibold tracking-[-0.01em] text-muted">
              Built for real life
            </p>
            <h2 className="mt-4 text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
              Good plans should survive a busy week.
            </h2>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">
              Foray reduces the decisions you need to hold in your head. Miss a
              day—or a fortnight—and everything is still there when you return.
            </p>
          </div>

          <div className="flex gap-2 self-end">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Previous"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e8ed] text-foreground/70 transition-colors hover:bg-[#d2d2d7] hover:text-foreground"
            >
              <ForayIcon name="arrowLeft" size="small" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Next"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e8ed] text-foreground/70 transition-colors hover:bg-[#d2d2d7] hover:text-foreground"
            >
              <ForayIcon name="arrowRight" size="small" />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="scrollbar-hide mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2"
        >
          {PROPS.map((prop) => (
            <article
              key={prop.title}
              data-outcome-card
              className="relative flex w-[min(86vw,340px)] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] bg-ink text-white sm:w-[380px] lg:w-[400px]"
            >
              <div className="flex flex-1 flex-col p-7 sm:p-8">
                <p className="text-[13px] font-semibold text-white/55">
                  {prop.label}
                </p>
                <h3 className="mt-3 text-balance text-2xl font-bold leading-tight tracking-[-0.03em] sm:text-[1.7rem]">
                  {prop.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/60 sm:text-[15px]">
                  {prop.body}
                </p>
              </div>
              <div className="relative mt-auto h-56 overflow-hidden sm:h-64">
                <Image
                  src={prop.image}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="400px"
                  className={prop.imageClass}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

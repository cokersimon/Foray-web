"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CarouselProgress, useTimedCarousel } from "./carousel-progress";

const PROPS = [
  {
    image: "/brand/outcome-sunday.png",
    label: "Sunday reset",
    title: "When nothing sounds obvious.",
    body: "Sit down once, pick a small set that fits the week, and leave the rest. Your recipes wait until you are ready.",
  },
  {
    image: "/brand/outcome-midweek.png",
    label: "Midweek scramble",
    title: "When your head is already full.",
    body: "Open one tidy list — quantities combined, aisles sorted — and get through the shop without starting from scratch.",
  },
  {
    image: "/brand/outcome-cook.png",
    label: "Dinner, now",
    title: "When dinner needs to happen.",
    body: "Prop the phone by the hob, follow one clear step at a time, and set timers without leaving cook mode.",
  },
];

const SLIDE_MS = 8000;
const SCROLL_SETTLE_MS = 900;

export function ValueProps() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.35, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const {
    index,
    goTo,
    setPaused,
    progressKey,
    autoplay,
    durationMs,
  } = useTimedCarousel(PROPS.length, { durationMs: SLIDE_MS, inView });

  useEffect(() => {
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
    if (best !== index) goTo(best);
  }

  return (
    <section
      ref={sectionRef}
      className="bg-background px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
            Good plans should survive a busy week
            <span className="text-brand-dot">.</span>
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            Foray reduces the decisions you need to hold in your head. Miss a
            day—or a fortnight—and everything is still there when you return.
          </p>
        </div>

        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="scrollbar-hide mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
        >
          {PROPS.map((prop) => (
            <article
              key={prop.title}
              data-outcome-card
              className="relative flex w-[min(86vw,340px)] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] bg-ink text-white sm:w-[380px] lg:w-[400px]"
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
                  className="object-cover"
                />
              </div>
            </article>
          ))}
        </div>

        <CarouselProgress
          count={PROPS.length}
          index={index}
          onSelect={goTo}
          autoplay={autoplay}
          durationMs={durationMs}
          progressKey={progressKey}
          className="mt-8"
        />
      </div>
    </section>
  );
}

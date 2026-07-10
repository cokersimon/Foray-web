"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CarouselProgress, useTimedCarousel } from "./carousel-progress";
import { cn } from "@/lib/cn";

const PROPS = [
  {
    image: "/brand/feature-household.png",
    title: "Shop for the whole household.",
    body: "Set servings once. Every list scales so you are not doing the maths for four people at the till.",
    band: "bg-[#ff9500]",
  },
  {
    image: "/brand/feature-pantry.png",
    title: "Snap your pantry. Get a recipe.",
    body: "Take a photo of what you already have. Foray turns it into a recipe you can cook tonight.",
    band: "bg-[#30b0c7]",
  },
  {
    image: "/brand/feature-create.png",
    title: "Make it yours.",
    body: "Create recipes from scratch, or turn a photo or screenshot into ingredients and steps you can edit.",
    band: "bg-[#5856d6]",
  },
  {
    image: "/brand/feature-chef-siri.png",
    title: "Ask Chef. Talk to Siri.",
    body: "Chef AI builds a recipe from whatever you fancy. Siri can help when your hands are full.",
    band: "bg-[#007aff]",
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
            Built for how you actually cook
            <span className="text-brand-dot">.</span>
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            Beyond the plan–shop–cook loop. Household servings, pantry snaps,
            your own recipes, and Chef AI with Siri.
          </p>
        </div>

        {/*
          Same left inset as hero / pricing (max-w-7xl). Bleed only to the
          right so cards can leave at the viewport edge while scrolling.
        */}
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className={cn(
            "scrollbar-hide mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth",
            "pb-8 pt-3",
            "mr-[calc(50%-50vw)] pr-[calc(50vw-50%)]",
          )}
        >
          {PROPS.map((prop) => (
            <article
              key={prop.title}
              data-outcome-card
              className="relative flex w-[min(86vw,340px)] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:w-[380px] lg:w-[400px]"
            >
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
                  className="object-contain object-bottom p-3 sm:p-4"
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

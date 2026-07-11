"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SfSymbol, type SfSymbolName } from "@/components/brand/sf-symbol";
import {
  browserLocale,
  currencySfSymbolFromLocale,
} from "@/lib/currency-sf-symbol";
import { AppStoreBadge } from "./app-store-badge";
import { CarouselProgress, useTimedCarousel } from "./carousel-progress";
import { ProductPhone, type ProductScreen } from "./product-phone";
import { cn } from "@/lib/cn";

const HERO_DURATION_MS = 4500;

type HeroBadge = {
  icon: SfSymbolName | "currency";
  label: string;
  className: string;
};

type HeroSlide = {
  image: string;
  alt: string;
  screen: ProductScreen;
  badges: [HeroBadge, HeroBadge];
};

const SLIDES: HeroSlide[] = [
  {
    image: "/brand/hero-flatlay.webp",
    alt: "Fresh recipe ingredients laid out for cooking",
    screen: "hero-nutrition",
    badges: [
      {
        icon: "clock",
        label: "Save time",
        className: "left-[4%] top-[10%] sm:left-[6%] sm:top-[12%]",
      },
      {
        icon: "currency",
        label: "Save money",
        className: "right-[6%] top-[18%] sm:right-[10%] sm:top-[20%]",
      },
    ],
  },
  {
    image: "/brand/hero-flatlay.webp",
    alt: "Dietary preferences and allergens you can set in Foray",
    screen: "hero-allergies",
    badges: [
      {
        icon: "checkmarkSealFill",
        label: "Diet-safe picks",
        className: "left-[4%] top-[12%] sm:left-[6%] sm:top-[14%]",
      },
      {
        icon: "forkKnife",
        label: "Eat healthier",
        className: "right-[6%] top-[22%] sm:right-[10%] sm:top-[24%]",
      },
    ],
  },
  {
    image: "/brand/hero-shopping.webp",
    alt: "Shopping with a trolley in a grocery aisle",
    screen: "hero-instore",
    badges: [
      {
        icon: "forkKnife",
        label: "Eat healthier",
        className: "left-[5%] top-[12%] sm:left-[7%] sm:top-[14%]",
      },
      {
        icon: "cart",
        label: "Less to decide",
        // Mobile: down + left so it clears the phone; desktop keeps airier placement.
        className:
          "right-[14%] top-[32%] sm:right-[8%] sm:top-[24%]",
      },
    ],
  },
  {
    image: "/brand/hero-cooking.webp",
    alt: "Cooking a meal in progress on the hob",
    screen: "hero-cook",
    badges: [
      {
        icon: "chartPieFill",
        label: "Know what you're eating",
        className: "left-[3%] top-[10%] sm:left-[5%] sm:top-[12%]",
      },
      {
        icon: "trashFill",
        label: "Less waste",
        // Mobile: nudge down ~16px so it sits clearer above the phone.
        className:
          "right-[8%] top-[calc(20%+1rem)] sm:right-[10%] sm:top-[22%]",
      },
    ],
  },
];

function GlassBadge({
  icon,
  label,
  className,
}: {
  icon: SfSymbolName;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-badge pointer-events-none absolute z-20", className)}>
      <div className="glass-badge-inner">
        <span className="glass-badge-icon">
          <SfSymbol name={icon} size={14} className="text-white" />
        </span>
        <span className="glass-badge-label">{label}</span>
      </div>
    </div>
  );
}

export function Hero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [inView, setInView] = useState(true);
  /** Desktop keeps autoplay; phones are swipe-only (no slideshow fill). */
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [currencyIcon, setCurrencyIcon] =
    useState<SfSymbolName>("sterlingsign");
  const { index, goTo, progressKey, durationMs, autoplay, setPaused } =
    useTimedCarousel(SLIDES.length, {
      durationMs: HERO_DURATION_MS,
      inView,
      autoplay: autoplayEnabled,
    });

  const slide = SLIDES[index]!;

  useEffect(() => {
    setCurrencyIcon(currencySfSymbolFromLocale(browserLocale()));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setAutoplayEnabled(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    setPaused(true);
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    touchStartX.current = null;
    setPaused(false);
    if (start == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? start) - start;
    if (Math.abs(dx) < 48) return;
    // Swipe left → next, swipe right → previous (same language as how-it-works).
    goTo(index + (dx < 0 ? 1 : -1));
  }

  return (
    <section className="relative overflow-hidden bg-background px-5 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 md:pb-28 md:pt-28 lg:px-10 lg:pt-32 lg:pb-32">
      {/* Prefetch all carousel WebPs so the first crossfade never flashes. */}
      <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
        {SLIDES.map((s) => (
          <Image
            key={`preload-${s.image}`}
            src={s.image}
            alt=""
            width={1536}
            height={1024}
            priority
            sizes="1px"
          />
        ))}
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-8 sm:gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
        <div className="relative z-10 text-center lg:text-left">
          <h1
            className="motion-safe:animate-rise text-balance text-[clamp(2.6rem,7.2vw,5.75rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground"
            style={{ animationDelay: "0s" }}
          >
            Swipe. Shop. Cook
            <span className="text-brand-dot">.</span>
          </h1>
          <p
            className="motion-safe:animate-rise mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted sm:mt-6 sm:text-lg lg:mx-0"
            style={{ animationDelay: "0.16s" }}
          >
            Swipe through recipes, tap to add, and your trolley builds itself.
            Foray fills your online basket for you, or shop in person.
          </p>

          <div
            className="motion-safe:animate-rise mt-7 hidden justify-center sm:mt-8 md:flex lg:justify-start"
            style={{ animationDelay: "0.24s" }}
          >
            <AppStoreBadge location="hero" />
          </div>
        </div>

        <div
          ref={stageRef}
          className="motion-safe:animate-rise relative mx-auto w-full max-w-[380px] touch-pan-y sm:max-w-[620px] md:max-w-[700px] lg:max-w-none"
          style={{ animationDelay: "0.18s" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setPaused(false);
            }
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-section-grey sm:aspect-[5/4] sm:rounded-[48px]">
              {SLIDES.map((s, i) => (
                <Image
                  key={s.image}
                  src={s.image}
                  alt={i === index ? s.alt : ""}
                  fill
                  priority
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 700px, 640px"
                  className={cn(
                    "object-cover transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    i === index ? "opacity-100" : "opacity-0",
                  )}
                  draggable={false}
                />
              ))}

              {slide.badges.map((badge) => (
                <GlassBadge
                  key={`${index}-${badge.label}`}
                  icon={
                    badge.icon === "currency" ? currencyIcon : badge.icon
                  }
                  label={badge.label}
                  className={cn(
                    badge.className,
                    "motion-safe:animate-rise",
                  )}
                />
              ))}
            </div>

            {/* Outside overflow-hidden so the bezel can break the frame edge.
                Width is % of the frame so mobile/desktop scale together.
                Mobile: inset ~16px from the right so it doesn’t kiss the viewport. */}
            <div className="pointer-events-none absolute -bottom-[8%] right-4 z-20 w-[28%] sm:-bottom-[10%] sm:right-[-4%] sm:w-[24%] lg:w-[23%]">
              <ProductPhone
                screen={slide.screen}
                priority
                className="mx-0 w-full"
              />
            </div>
          </div>

          <CarouselProgress
            count={SLIDES.length}
            index={index}
            onSelect={goTo}
            autoplay={autoplay}
            durationMs={durationMs}
            progressKey={progressKey}
            className="mt-5"
          />
        </div>
      </div>
    </section>
  );
}

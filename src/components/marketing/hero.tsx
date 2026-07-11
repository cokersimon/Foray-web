"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SfSymbol, type SfSymbolName } from "@/components/brand/sf-symbol";
import { AppStoreBadge } from "./app-store-badge";
import { CarouselProgress, useTimedCarousel } from "./carousel-progress";
import { ProductPhone, type ProductScreen } from "./product-phone";
import { cn } from "@/lib/cn";

const HERO_DURATION_MS = 6000;

type BadgeSide = "left" | "right";
type BadgeEdge = "top" | "bottom";

type HeroBadge = {
  icon: SfSymbolName;
  label: string;
  side: BadgeSide;
  edge: BadgeEdge;
};

type HeroSlide = {
  alt: string;
  screen: ProductScreen;
  badges: [HeroBadge, HeroBadge];
};

/**
 * Six screens — only the current slide’s two tags render.
 * Tags alternate sides/edges so consecutive slides don’t stack in the same spot.
 */
const SLIDES: HeroSlide[] = [
  {
    alt: "A populated week of breakfasts, lunches and dinners in the Foray planner",
    screen: "hero-plan",
    badges: [
      {
        icon: "forkKnife",
        label: "Less to decide",
        side: "left",
        edge: "top",
      },
      {
        icon: "cart",
        label: "Trolley builds itself",
        side: "right",
        edge: "bottom",
      },
    ],
  },
  {
    alt: "Grocery list with prices and supermarket checkout options",
    screen: "hero-groceries",
    badges: [
      {
        icon: "banknote",
        label: "Priced as you plan",
        side: "right",
        edge: "top",
      },
      {
        icon: "cart",
        label: "One tap to Tesco",
        side: "left",
        edge: "bottom",
      },
    ],
  },
  {
    alt: "My Recipes library with saved meals and social import sources",
    screen: "hero-recipes",
    badges: [
      {
        icon: "heartFill",
        label: "Save your recipes",
        side: "left",
        edge: "top",
      },
      {
        icon: "arrowRight",
        label: "Import from TikTok",
        side: "right",
        edge: "bottom",
      },
    ],
  },
  {
    alt: "Meal nutrition facts and allergy-safe dietary picks",
    screen: "hero-nutrition",
    badges: [
      {
        icon: "chartPieFill",
        label: "Know what you're eating",
        side: "left",
        edge: "top",
      },
      {
        icon: "checkmarkSealFill",
        label: "Allergy-safe picks",
        side: "right",
        edge: "bottom",
      },
    ],
  },
  {
    alt: "Add a Recipe hub with Chef AI, URL import, photo and pantry",
    screen: "hero-create",
    badges: [
      {
        icon: "checkmarkSealFill",
        label: "Snap your pantry",
        side: "right",
        edge: "top",
      },
      {
        icon: "forkKnife",
        label: "Get creative with Chef AI",
        side: "left",
        edge: "bottom",
      },
    ],
  },
  {
    alt: "Cook mode with a live countdown timer and step tracking",
    screen: "hero-cook",
    badges: [
      {
        icon: "clock",
        label: "Live timers",
        side: "right",
        edge: "top",
      },
      {
        icon: "checkmark",
        label: "Steps on Lock Screen",
        side: "left",
        edge: "bottom",
      },
    ],
  },
];

function badgePositionClass(side: BadgeSide, edge: BadgeEdge, order: number) {
  return cn(
    "absolute z-20 max-w-[min(11.5rem,42vw)] lg:max-w-[12.5rem]",
    // Mobile: top-left + bottom-right, 16px from the phone bezel (not the stage).
    order === 0
      ? "left-4 top-4 right-auto bottom-auto"
      : "right-4 bottom-4 left-auto top-auto",
    // Desktop: keep per-slide side/edge beside the phone.
    "lg:left-auto lg:right-auto lg:top-auto lg:bottom-auto",
    side === "left" && "lg:right-full lg:mr-4",
    side === "right" && "lg:left-full lg:ml-4",
    edge === "top" && "lg:top-[18%]",
    edge === "bottom" && "lg:bottom-[24%]",
  );
}

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
    <div className={cn("glass-badge pointer-events-none", className)}>
      <div className="glass-badge-inner">
        <span className="glass-badge-icon">
          <SfSymbol name={icon} size={14} />
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
  const { index, goTo, progressKey, durationMs, autoplay, setPaused } =
    useTimedCarousel(SLIDES.length, {
      durationMs: HERO_DURATION_MS,
      inView,
      autoplay: true,
    });

  const slide = SLIDES[index]!;

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
    goTo(index + (dx < 0 ? 1 : -1));
  }

  return (
    <section className="relative overflow-x-clip bg-background px-5 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 md:pb-28 md:pt-20 lg:overflow-visible lg:px-10 lg:pt-24 lg:pb-32">
      <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-6">
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
            Foray fills your online basket for you, or helps you shop in person.
          </p>

          <div
            className="motion-safe:animate-rise mt-7 flex justify-center sm:mt-8 lg:justify-start"
            style={{ animationDelay: "0.24s" }}
          >
            <AppStoreBadge location="hero" />
          </div>
        </div>

        <div
          ref={stageRef}
          className="motion-safe:animate-rise relative -mx-5 w-[calc(100%+2.5rem)] touch-pan-y sm:-mx-6 sm:w-[calc(100%+3rem)] lg:mx-0 lg:w-full lg:max-w-none"
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
          <div className="relative mx-auto w-[min(72%,17.5rem)] sm:w-[min(70%,19rem)] lg:w-[min(58%,20rem)]">
            <ProductPhone
              screen={slide.screen}
              priority
              className="mx-0 w-full"
            >
              {/* Tags sit on the phone box so 16px is from the bezel, not the stage */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.screen}
                  className="pointer-events-none absolute inset-0 z-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                >
                  {slide.badges.map((badge, order) => (
                    <GlassBadge
                      key={badge.label}
                      icon={badge.icon}
                      label={badge.label}
                      className={badgePositionClass(
                        badge.side,
                        badge.edge,
                        order,
                      )}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </ProductPhone>
          </div>

          <p className="sr-only">{slide.alt}</p>

          <CarouselProgress
            count={SLIDES.length}
            index={index}
            onSelect={goTo}
            autoplay={autoplay}
            durationMs={durationMs}
            progressKey={progressKey}
            className="mt-6"
          />
        </div>
      </div>
    </section>
  );
}

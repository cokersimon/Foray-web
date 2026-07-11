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
  /** Inner pill fill — icon disc stays black. */
  tone: string;
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
        tone: "#FFE4C8",
      },
      {
        icon: "cart",
        label: "Trolley builds itself",
        side: "right",
        edge: "bottom",
        tone: "#D8F0E8",
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
        tone: "#FFF0C2",
      },
      {
        icon: "cart",
        label: "One tap to Tesco",
        side: "left",
        edge: "bottom",
        tone: "#D6ECFF",
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
        tone: "#FFDCE6",
      },
      {
        icon: "arrowRight",
        label: "Import from TikTok",
        side: "right",
        edge: "bottom",
        tone: "#E2F4D8",
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
        tone: "#E6F6F2",
      },
      {
        icon: "forkKnife",
        label: "Get creative with Chef AI",
        side: "left",
        edge: "bottom",
        tone: "#FFE8D4",
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
        tone: "#E8E0FF",
      },
      {
        icon: "checkmarkSealFill",
        label: "Allergy-safe picks",
        side: "right",
        edge: "bottom",
        tone: "#DFF3FF",
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
        tone: "#FFE6CC",
      },
      {
        icon: "checkmark",
        label: "Steps on Lock Screen",
        side: "left",
        edge: "bottom",
        tone: "#DCEFE6",
      },
    ],
  },
];

function badgePositionClass(side: BadgeSide, edge: BadgeEdge) {
  const vertical =
    edge === "top"
      ? "top-[14%] sm:top-[16%] lg:top-[18%]"
      : "bottom-[22%] sm:bottom-[24%] lg:bottom-[24%]";

  return cn(
    "absolute z-20 max-w-[min(11.5rem,42vw)] lg:max-w-[12.5rem]",
    // Mobile: 16px from stage edge. Desktop: 16px from phone bezel.
    side === "left" &&
      "left-4 right-auto lg:left-auto lg:right-full lg:mr-4",
    side === "right" &&
      "right-4 left-auto lg:right-auto lg:left-full lg:ml-4",
    vertical,
  );
}

function GlassBadge({
  icon,
  label,
  tone,
  className,
}: {
  icon: SfSymbolName;
  label: string;
  tone: string;
  className?: string;
}) {
  return (
    <div className={cn("glass-badge pointer-events-none", className)}>
      <div className="glass-badge-inner" style={{ background: tone }}>
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
            />

            {/* Only this slide’s two tags — swap with the screen */}
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.screen}
                className="pointer-events-none absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {slide.badges.map((badge) => (
                  <GlassBadge
                    key={badge.label}
                    icon={badge.icon}
                    label={badge.label}
                    tone={badge.tone}
                    className={badgePositionClass(badge.side, badge.edge)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
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

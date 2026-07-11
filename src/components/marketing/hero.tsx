"use client";

import { useEffect, useRef, useState } from "react";
import { SfSymbol, type SfSymbolName } from "@/components/brand/sf-symbol";
import { AppStoreBadge } from "./app-store-badge";
import { CarouselProgress, useTimedCarousel } from "./carousel-progress";
import { ProductPhone, type ProductScreen } from "./product-phone";
import { cn } from "@/lib/cn";

const HERO_DURATION_MS = 4000;

type HeroBadge = {
  icon: SfSymbolName;
  label: string;
  className: string;
};

type HeroSlide = {
  alt: string;
  screen: ProductScreen;
  badges: [HeroBadge, HeroBadge];
};

/**
 * Six screens — slides 1–2 are the sales pitch; 3–6 for lingerers.
 * Tags alternate corners so consecutive slides don’t stack in the same spot.
 */
const SLIDES: HeroSlide[] = [
  {
    alt: "A populated week of breakfasts, lunches and dinners in the Foray planner",
    screen: "hero-plan",
    badges: [
      {
        icon: "forkKnife",
        label: "Less to decide",
        className: "-left-[18%] top-[18%] sm:-left-[14%] sm:top-[16%]",
      },
      {
        icon: "cart",
        label: "Trolley builds itself",
        className: "-right-[22%] bottom-[28%] sm:-right-[18%] sm:bottom-[26%]",
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
        className: "-right-[18%] top-[16%] sm:-right-[14%] sm:top-[14%]",
      },
      {
        icon: "cart",
        label: "One tap to Tesco",
        className: "-left-[20%] bottom-[30%] sm:-left-[16%] sm:bottom-[28%]",
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
        className: "-left-[18%] top-[20%] sm:-left-[14%] sm:top-[18%]",
      },
      {
        icon: "arrowRight",
        label: "Import from TikTok",
        className: "-right-[20%] bottom-[26%] sm:-right-[16%] sm:bottom-[24%]",
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
        className: "-right-[18%] top-[18%] sm:-right-[14%] sm:top-[16%]",
      },
      {
        icon: "forkKnife",
        label: "Get creative with Chef AI",
        className: "-left-[24%] bottom-[28%] sm:-left-[20%] sm:bottom-[26%]",
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
        className: "-left-[22%] top-[16%] sm:-left-[18%] sm:top-[14%]",
      },
      {
        icon: "checkmarkSealFill",
        label: "Allergy-safe picks",
        className: "-right-[18%] bottom-[30%] sm:-right-[14%] sm:bottom-[28%]",
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
        className: "-right-[14%] top-[18%] sm:-right-[12%] sm:top-[16%]",
      },
      {
        icon: "checkmark",
        label: "Steps on Lock Screen",
        className: "-left-[22%] bottom-[26%] sm:-left-[18%] sm:bottom-[24%]",
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
    <section className="relative overflow-hidden bg-background px-5 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 md:pb-28 md:pt-20 lg:px-10 lg:pt-24 lg:pb-32">
      <div className="mx-auto grid max-w-7xl items-center gap-10 sm:gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
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
          className="motion-safe:animate-rise relative mx-auto w-full max-w-[280px] touch-pan-y sm:max-w-[320px] md:max-w-[360px] lg:max-w-[400px]"
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
          {/* Phone is the hero object; tags sit half-on / half-off the bezel. */}
          <div className="relative mx-auto w-[78%] sm:w-[80%]">
            <ProductPhone
              screen={slide.screen}
              priority
              className="mx-0 w-full"
            />
            {slide.badges.map((badge) => (
              <GlassBadge
                key={`${slide.screen}-${badge.label}`}
                icon={badge.icon}
                label={badge.label}
                className={cn(badge.className, "motion-safe:animate-rise")}
              />
            ))}
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

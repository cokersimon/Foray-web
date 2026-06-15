"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Dumbbell,
  Utensils,
  ShoppingCart,
  Flame,
  Target,
  Apple,
  Clock,
  ListChecks,
  Heart,
  BedDouble,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  screen: React.ReactNode;
  cards: CardDef[];
}

interface CardDef {
  icon: React.ReactNode;
  label: string;
  value: string;
  rotation: number;
  desktopClass: string;
}

const FEATURES: Feature[] = [
  {
    id: "fitness",
    title: "Train with precision.",
    subtitle:
      "Adaptive programs that respond to your recovery, goals, and daily readiness — every rep counts.",
    screen: <FitnessScreen />,
    cards: [
      {
        icon: <Dumbbell className="h-4 w-4 text-sky-500" />,
        label: "Today's Session",
        value: "Upper Body · 48 min",
        rotation: -6,
        desktopClass:
          "top-[15%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Flame className="h-4 w-4 text-orange-500" />,
        label: "Calories burnt",
        value: "427 kcal",
        rotation: 5,
        desktopClass:
          "top-[12%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Target className="h-4 w-4 text-emerald-500" />,
        label: "Weekly Goal",
        value: "4 of 5 sessions",
        rotation: 7,
        desktopClass:
          "bottom-[12%] left-[20%] lg:left-[24%] w-[140px] lg:w-[160px]",
      },
    ],
  },
  {
    id: "nutrition",
    title: "Fuel your body.",
    subtitle:
      "AI-optimised meal plans that hit your macros, respect your preferences, and adapt week to week.",
    screen: <NutritionScreen />,
    cards: [
      {
        icon: <Utensils className="h-4 w-4 text-emerald-500" />,
        label: "Protein",
        value: "142g / 160g",
        rotation: -5,
        desktopClass:
          "top-[14%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Apple className="h-4 w-4 text-red-500" />,
        label: "Carbs",
        value: "198g / 220g",
        rotation: 6,
        desktopClass:
          "top-[12%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Flame className="h-4 w-4 text-amber-500" />,
        label: "Calories",
        value: "1,847 / 2,100",
        rotation: -8,
        desktopClass:
          "bottom-[10%] right-[20%] lg:right-[24%] w-[140px] lg:w-[160px]",
      },
    ],
  },
  {
    id: "groceries",
    title: "From plan to pantry.",
    subtitle:
      "Your meal plan becomes a smart grocery list instantly — organised by aisle, optimised for zero waste.",
    screen: <GroceriesScreen />,
    cards: [
      {
        icon: <ListChecks className="h-4 w-4 text-sky-500" />,
        label: "This Week's Recipes",
        value: "12 meals planned",
        rotation: -4,
        desktopClass:
          "top-[15%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <ShoppingCart className="h-4 w-4 text-emerald-500" />,
        label: "Grocery List",
        value: "23 items · $87",
        rotation: 5,
        desktopClass:
          "top-[13%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Clock className="h-4 w-4 text-violet-500" />,
        label: "Time Saved",
        value: "~2.5 hrs / week",
        rotation: -6,
        desktopClass:
          "bottom-[11%] left-[20%] lg:left-[24%] w-[140px] lg:w-[160px]",
      },
    ],
  },
  {
    id: "recovery",
    title: "Adapt and recover.",
    subtitle:
      "Sleep, HRV, and readiness data feed back into your plan — so you push when ready and rest when needed.",
    screen: <RecoveryScreen />,
    cards: [
      {
        icon: <BedDouble className="h-4 w-4 text-indigo-500" />,
        label: "Sleep Score",
        value: "92 — Excellent",
        rotation: -5,
        desktopClass:
          "top-[14%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Activity className="h-4 w-4 text-violet-500" />,
        label: "HRV",
        value: "62 ms",
        rotation: 4,
        desktopClass:
          "top-[12%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Heart className="h-4 w-4 text-rose-500" />,
        label: "Recovery",
        value: "87% — Ready",
        rotation: -7,
        desktopClass:
          "bottom-[12%] right-[20%] lg:right-[24%] w-[140px] lg:w-[160px]",
      },
    ],
  },
];

const FEATURE_COUNT = FEATURES.length;

/** 1 / features.length — each feature owns one equal chunk of scrollYProgress. */
function chunkSize() {
  return 1 / FEATURE_COUNT;
}

/**
 * Opacity keyframes per feature index (0–1 scroll progress).
 * Index 0: fully visible from load until end of chunk, then fades out.
 * Index > 0: fades in at chunk start, holds, fades out at chunk end.
 */
function featureOpacityRange(index: number): {
  input: [number, number, number, number];
  output: [number, number, number, number];
} {
  const chunk = chunkSize();
  const start = index * chunk;
  const end = (index + 1) * chunk;

  if (index === 0) {
    const eps = Math.min(0.001, chunk * 0.02);
    /** Fully 0 before the next chunk so copy never ghosts behind the next headline. */
    return {
      input: [0, eps, end - 0.08, end - 0.02],
      output: [1, 1, 1, 0],
    };
  }

  /** Slight stagger vs previous feature so two titles are never meaningfully on together. */
  return {
    input: [start + 0.01, start + 0.06, end - 0.08, end - 0.02],
    output: [0, 1, 1, 0],
  };
}

// ---------------------------------------------------------------------------
// Phone screen content for each feature
// ---------------------------------------------------------------------------

function FitnessScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-sky-400">
        Today&apos;s Workout
      </div>
      <div className="mb-5 text-xl font-bold">Upper Body Power</div>
      <div className="space-y-2.5">
        {[
          { name: "Bench Press", sets: "4 × 8", done: true },
          { name: "Overhead Press", sets: "3 × 10", done: true },
          { name: "Bent-over Row", sets: "4 × 8", done: false },
          { name: "Face Pulls", sets: "3 × 15", done: false },
          { name: "Bicep Curls", sets: "3 × 12", done: false },
        ].map((ex) => (
          <div
            key={ex.name}
            className={cn(
              "flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5",
              ex.done && "opacity-50",
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "h-3.5 w-3.5 rounded-full border-2",
                  ex.done
                    ? "border-sky-500 bg-sky-500"
                    : "border-white/20",
                )}
              />
              <span className="text-xs">{ex.name}</span>
            </div>
            <span className="text-[10px] text-neutral-500">{ex.sets}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NutritionScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-emerald-400">
        Today&apos;s Nutrition
      </div>
      <div className="mb-5 text-xl font-bold">1,847 kcal</div>
      <div className="flex gap-2">
        {[
          { label: "Protein", value: "142g", color: "bg-emerald-500" },
          { label: "Carbs", value: "198g", color: "bg-blue-500" },
          { label: "Fat", value: "64g", color: "bg-amber-500" },
        ].map((m) => (
          <div key={m.label} className="flex-1 rounded-xl bg-white/5 p-2.5">
            <div className={cn("mb-1.5 h-1 w-6 rounded-full", m.color)} />
            <div className="text-xs font-semibold">{m.value}</div>
            <div className="text-[10px] text-neutral-500">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        {["Breakfast", "Lunch", "Dinner"].map((meal) => (
          <div
            key={meal}
            className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"
          >
            <span className="text-xs">{meal}</span>
            <span className="text-[10px] text-neutral-500">Logged</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroceriesScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-emerald-400">
        Smart shopping list
      </div>
      <div className="mb-5 text-xl font-bold">23 Items</div>
      <div className="space-y-2">
        {[
          { aisle: "Fruit & veg", items: "Spinach, Avocados, Bananas" },
          { aisle: "Protein", items: "Chicken breast, Salmon, Eggs" },
          { aisle: "Dairy", items: "Greek yoghurt, Cottage cheese" },
          { aisle: "Grains", items: "Oats, Brown rice, Quinoa" },
        ].map((section) => (
          <div key={section.aisle} className="rounded-xl bg-white/5 p-3">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-neutral-400">
              {section.aisle}
            </div>
            <div className="text-xs text-neutral-300">{section.items}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoveryScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-violet-400">
        Recovery Score
      </div>
      <div className="mb-1 text-4xl font-bold">87</div>
      <div className="mb-5 text-xs text-neutral-500">Excellent</div>
      <div className="space-y-3">
        {[
          { label: "Sleep", value: "7h 42m", pct: 85 },
          { label: "HRV", value: "62 ms", pct: 78 },
          { label: "Soreness", value: "Low", pct: 92 },
        ].map((metric) => (
          <div key={metric.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{metric.label}</span>
              <span className="text-neutral-500">{metric.value}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${metric.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// iPhone Frame
// ---------------------------------------------------------------------------

function IPhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full">
      <div className="max-h-[55vh] overflow-hidden rounded-[2.5rem] border-[3px] border-neutral-300 bg-black shadow-xl shadow-black/10">
        <div className="relative flex justify-center bg-black pt-2.5 pb-1.5">
          <div className="h-6 w-[90px] rounded-full border border-neutral-800 bg-black" />
        </div>
        <div className="aspect-[9/16] overflow-hidden">{children}</div>
        <div className="flex justify-center bg-black pt-1.5 pb-2.5">
          <div className="h-1 w-28 rounded-full bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Headline per feature (scroll-linked opacity + y)
// ---------------------------------------------------------------------------

function FeatureHeadline({
  feature,
  index,
  progress,
}: {
  feature: Feature;
  index: number;
  progress: MotionValue<number>;
}) {
  const { input, output } = featureOpacityRange(index);
  const opacity = useTransform(progress, input, output);
  const visibility = useTransform(opacity, (o) =>
    o < 0.01 ? "hidden" : "visible",
  );

  return (
    <motion.div
      style={{ opacity, visibility }}
      className="pointer-events-none absolute inset-x-0 top-0 px-4"
    >
      <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
        {feature.title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted md:mt-4 md:text-lg">
        {feature.subtitle}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Single floating bento card (extracted for Rules of Hooks compliance)
// ---------------------------------------------------------------------------

function FloatingCard({
  card,
  featureIndex,
  progress,
}: {
  card: CardDef;
  featureIndex: number;
  progress: MotionValue<number>;
}) {
  const { input, output } = featureOpacityRange(featureIndex);
  const opacity = useTransform(progress, input, output);
  const visibility = useTransform(opacity, (o) =>
    o < 0.01 ? "hidden" : "visible",
  );
  const y = useTransform(
    progress,
    input,
    featureIndex === 0 ? [0, 0, 0, -40] : [60, 0, 0, -40],
  );
  const scale = useTransform(
    progress,
    input,
    featureIndex === 0 ? [1, 1, 1, 0.9] : [0.85, 1, 1, 0.9],
  );

  return (
    <motion.div
      style={{ opacity, visibility, y, scale, rotate: card.rotation }}
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white p-3 shadow-sm backdrop-blur-md md:rounded-3xl md:p-4",
        "absolute hidden md:block",
        card.desktopClass,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        {card.icon}
        <span className="text-[10px] font-medium text-muted">{card.label}</span>
      </div>
      <div className="text-xs font-semibold text-foreground">{card.value}</div>
    </motion.div>
  );
}

function MobileStackRow({ card }: { card: CardDef }) {
  return (
    <div className="w-full rounded-2xl border border-black/[0.06] bg-white p-3 shadow-sm backdrop-blur-md">
      <div className="mb-1.5 flex items-center gap-2">
        {card.icon}
        <span className="text-[10px] font-semibold text-muted">
          {card.label}
        </span>
      </div>
      <div className="text-xs font-semibold text-foreground">{card.value}</div>
    </div>
  );
}

function MobileFeatureStack({
  feature,
  index,
  progress,
}: {
  feature: Feature;
  index: number;
  progress: MotionValue<number>;
}) {
  const { input, output } = featureOpacityRange(index);
  const opacity = useTransform(progress, input, output);
  const visibility = useTransform(opacity, (o) =>
    o < 0.01 ? "hidden" : "visible",
  );

  return (
    <motion.div
      style={{ opacity, visibility }}
      className="absolute inset-x-0 top-0 flex flex-col gap-2"
    >
      {feature.cards.map((card) => (
        <MobileStackRow key={card.label} card={card} />
      ))}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Feature card group — wraps multiple FloatingCards for one feature
// ---------------------------------------------------------------------------

function FeatureCards({
  feature,
  index,
  progress,
}: {
  feature: Feature;
  index: number;
  progress: MotionValue<number>;
}) {
  return (
    <>
      {feature.cards.map((card, i) => (
        <FloatingCard
          key={`${feature.id}-desk-${i}`}
          featureIndex={index}
          card={card}
          progress={progress}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Phone screen crossfade
// ---------------------------------------------------------------------------

function PhoneScreens({ progress }: { progress: MotionValue<number> }) {
  return (
    <div className="relative h-full w-full">
      {FEATURES.map((feature, i) => (
        <PhoneScreen key={feature.id} index={i} progress={progress}>
          {feature.screen}
        </PhoneScreen>
      ))}
    </div>
  );
}

function PhoneScreen({
  children,
  index,
  progress,
}: {
  children: React.ReactNode;
  index: number;
  progress: MotionValue<number>;
}) {
  const { input, output } = featureOpacityRange(index);
  const opacity = useTransform(progress, input, output);
  const visibility = useTransform(opacity, (o) =>
    o < 0.01 ? "hidden" : "visible",
  );

  return (
    <motion.div style={{ opacity, visibility }} className="absolute inset-0">
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function ScrollytellingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = scrollYProgress;

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: `calc(100vh * ${FEATURE_COUNT})` }}
    >
      <div
        className="sticky top-0 flex h-screen flex-col items-center justify-start overflow-hidden pt-[10vh] md:pt-[12vh]"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 80%, transparent 100%)",
        }}
      >
        {/* Headline area — auto height */}
        <div className="relative mb-8 w-full max-w-2xl shrink-0 px-4 text-center md:mb-10 md:px-6">
          <div className="relative min-h-[80px] md:min-h-[100px]">
            {FEATURES.map((feature, i) => (
              <FeatureHeadline
                key={feature.id}
                feature={feature}
                index={i}
                progress={progress}
              />
            ))}
          </div>
        </div>

        {/* Phone + bento cluster */}
        <div className="relative mx-auto flex w-full min-h-0 flex-1 flex-col items-center px-2 md:max-w-5xl md:px-0">
          <div className="relative w-full md:mx-auto md:h-[min(60vh,540px)]">
            {/* Desktop floating cards */}
            <div className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
              {FEATURES.map((feature, i) => (
                <FeatureCards
                  key={feature.id}
                  feature={feature}
                  index={i}
                  progress={progress}
                />
              ))}
            </div>

            <div className="relative z-20 mx-auto w-[200px] md:absolute md:left-1/2 md:top-1/2 md:w-[230px] lg:w-[250px] md:-translate-x-1/2 md:-translate-y-1/2">
              <IPhoneFrame>
                <PhoneScreens progress={progress} />
              </IPhoneFrame>
            </div>

            {/* Mobile: vertical bento stack directly under phone */}
            <div className="relative z-10 mx-auto mt-4 min-h-[200px] w-full max-w-[210px] md:hidden">
              {FEATURES.map((feature, i) => (
                <MobileFeatureStack
                  key={feature.id}
                  feature={feature}
                  index={i}
                  progress={progress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

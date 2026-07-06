"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Link2,
  Sparkles,
  FileDown,
  Heart,
  CalendarCheck,
  Hand,
  Layers,
  ShoppingCart,
  MapPin,
  CreditCard,
  Check,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/cn";

type FeatureId = "import" | "plan" | "cart" | "checkout";

interface Feature {
  id: FeatureId;
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
    id: "import",
    title: "Import any recipe.",
    subtitle:
      "Paste a link from TikTok, Instagram, or any food blog. Foray's AI Chef reads it and pulls out the ingredients and steps for you.",
    screen: <ImportScreen />,
    cards: [
      {
        icon: <Link2 className="h-4 w-4 text-brand-dot" />,
        label: "Paste a link",
        value: "TikTok, Insta, web",
        rotation: -6,
        desktopClass:
          "top-[15%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Sparkles className="h-4 w-4 text-brand-dot" />,
        label: "AI Chef parses it",
        value: "Ingredients + steps",
        rotation: 5,
        desktopClass:
          "top-[12%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <FileDown className="h-4 w-4 text-neutral-500" />,
        label: "Saved to your plan",
        value: "In seconds",
        rotation: 7,
        desktopClass:
          "bottom-[12%] left-[20%] lg:left-[24%] w-[140px] lg:w-[160px]",
      },
    ],
  },
  {
    id: "plan",
    title: "Swipe to fork.",
    subtitle:
      "Flick through recipes one thumb at a time. Swipe to fork the ones you fancy into this week's plan — no spreadsheets, no decision fatigue.",
    screen: <PlanScreen />,
    cards: [
      {
        icon: <Heart className="h-4 w-4 text-brand-dot" />,
        label: "Swipe right to fork",
        value: "Into this week",
        rotation: -5,
        desktopClass:
          "top-[14%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <CalendarCheck className="h-4 w-4 text-neutral-500" />,
        label: "This week",
        value: "12 meals planned",
        rotation: 6,
        desktopClass:
          "top-[12%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Hand className="h-4 w-4 text-neutral-500" />,
        label: "One thumb",
        value: "Zero faff",
        rotation: -8,
        desktopClass:
          "bottom-[10%] right-[20%] lg:right-[24%] w-[140px] lg:w-[160px]",
      },
    ],
  },
  {
    id: "cart",
    title: "One sorted trolley.",
    subtitle:
      "Every forked recipe rolls into a single shopping list — deduped, combined, and sorted by aisle. Two recipes that need an onion? That's one onion.",
    screen: <CartScreen />,
    cards: [
      {
        icon: <Layers className="h-4 w-4 text-brand-dot" />,
        label: "Deduped",
        value: "2 recipes, 1 onion",
        rotation: -4,
        desktopClass:
          "top-[15%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <ShoppingCart className="h-4 w-4 text-neutral-500" />,
        label: "Sorted by aisle",
        value: "23 items",
        rotation: 5,
        desktopClass:
          "top-[13%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <MapPin className="h-4 w-4 text-neutral-500" />,
        label: "In-store or online",
        value: "Your choice",
        rotation: -6,
        desktopClass:
          "bottom-[11%] left-[20%] lg:left-[24%] w-[140px] lg:w-[160px]",
      },
    ],
  },
  {
    id: "checkout",
    title: "Five clicks to dinner.",
    subtitle:
      "Check out your whole trolley online in five clicks, then jump straight into hands-free cook mode with built-in timers.",
    screen: <CheckoutScreen />,
    cards: [
      {
        icon: <CreditCard className="h-4 w-4 text-brand-dot" />,
        label: "Online checkout",
        value: "£2.49 fee",
        rotation: -5,
        desktopClass:
          "top-[14%] left-[18%] lg:left-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <Check className="h-4 w-4 text-neutral-500" />,
        label: "Five clicks",
        value: "Recipe → done",
        rotation: 4,
        desktopClass:
          "top-[12%] right-[18%] lg:right-[22%] w-[140px] lg:w-[160px]",
      },
      {
        icon: <ChefHat className="h-4 w-4 text-neutral-500" />,
        label: "Cook mode",
        value: "Steps + timers",
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

function ImportScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-brand-dot">
        Import a recipe
      </div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
        <span className="truncate text-[11px] text-neutral-300">
          tiktok.com/@chef/one-pot-orzo
        </span>
      </div>
      <div className="mb-3 flex items-center gap-2 text-[10px] text-neutral-500">
        <Sparkles className="h-3 w-3 text-brand-dot" />
        AI Chef is reading the recipe…
      </div>
      <div className="rounded-2xl bg-white/5 p-3">
        <div className="mb-1 text-sm font-semibold">One-Pot Lemon Orzo</div>
        <div className="mb-3 text-[10px] text-neutral-500">
          25 min · 4 servings
        </div>
        <div className="space-y-1.5">
          {["Orzo pasta", "Lemon", "Spinach", "Parmesan", "Garlic"].map(
            (ing) => (
              <div
                key={ing}
                className="flex items-center gap-2 text-[11px] text-neutral-300"
              >
                <Check className="h-3 w-3 text-brand-dot" />
                {ing}
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function PlanScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-brand-dot">
        Swipe to fork
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <div className="absolute inset-x-6 top-6 bottom-10 rotate-6 rounded-3xl border border-white/5 bg-white/[0.03]" />
        <div className="absolute inset-x-5 top-4 bottom-9 -rotate-3 rounded-3xl border border-white/5 bg-white/[0.04]" />
        <div className="relative w-full rounded-3xl border border-white/10 bg-white/[0.06] p-4">
          <div className="mb-3 aspect-[4/3] w-full rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02]" />
          <div className="text-sm font-semibold">Miso Salmon Bowl</div>
          <div className="mb-3 text-[10px] text-neutral-500">
            20 min · high protein
          </div>
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-neutral-400">
              Skip
            </span>
            <span className="flex items-center gap-1 rounded-full bg-brand-dot px-3 py-1 text-[10px] font-semibold text-black">
              <Heart className="h-3 w-3" /> Fork
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-brand-dot">
        Your trolley
      </div>
      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-xl font-bold">23 items</span>
        <span className="text-[10px] text-neutral-500">· deduped</span>
      </div>
      <div className="space-y-2">
        {[
          { aisle: "Fruit & veg", items: "Spinach, Lemon, Garlic" },
          { aisle: "Protein", items: "Salmon, Chicken, Eggs" },
          { aisle: "Dairy", items: "Greek yoghurt, Parmesan" },
          { aisle: "Cupboard", items: "Orzo, Rice, Miso paste" },
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

function CheckoutScreen() {
  return (
    <div className="flex h-full flex-col bg-[#0c0c0c] p-5 text-white">
      <div className="mb-3 text-[10px] font-medium uppercase tracking-widest text-brand-dot">
        Checkout
      </div>
      <div className="space-y-2">
        {[
          { label: "Groceries (23 items)", value: "£41.80" },
          { label: "Foray convenience fee", value: "£2.49" },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2.5"
          >
            <span className="text-[11px] text-neutral-300">{row.label}</span>
            <span className="text-[11px] font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5">
        <span className="text-xs font-semibold">Total</span>
        <span className="text-xs font-semibold">£44.29</span>
      </div>
      <button className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-dot py-3 text-xs font-semibold text-black">
        <CreditCard className="h-3.5 w-3.5" />
        Place order
      </button>
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
        <ChefHat className="h-3 w-3" /> Then straight into cook mode
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
      <div className="max-h-[45svh] overflow-hidden rounded-[2.5rem] border-[3px] border-neutral-300 bg-black shadow-xl shadow-black/10 md:max-h-[55vh]">
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
        "rounded-2xl border border-border bg-surface p-3 shadow-sm backdrop-blur-md md:rounded-3xl md:p-4",
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
    <div className="flex w-full flex-col items-center gap-1 rounded-2xl border border-border bg-surface p-2.5 text-center shadow-sm">
      {card.icon}
      <span className="text-[9px] font-semibold leading-tight text-muted">
        {card.label}
      </span>
      <span className="text-[10px] font-semibold leading-tight text-foreground">
        {card.value}
      </span>
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
      className="absolute inset-x-2 top-0 grid grid-cols-3 gap-2"
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

function PhoneScreens({
  progress,
  screenshots,
}: {
  progress: MotionValue<number>;
  screenshots: ScreenshotMap;
}) {
  return (
    <div className="relative h-full w-full">
      {FEATURES.map((feature, i) => {
        const screenshot = screenshots[feature.id];
        return (
          <PhoneScreen key={feature.id} index={i} progress={progress}>
            {screenshot ? (
              <Image
                src={screenshot}
                alt={feature.title}
                fill
                sizes="250px"
                className="object-cover"
              />
            ) : (
              feature.screen
            )}
          </PhoneScreen>
        );
      })}
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

/** feature id → public URL of a real Simulator capture, or undefined/null to
 * fall back to the coded mockup. Resolved server-side in page.tsx. */
export type ScreenshotMap = Partial<Record<FeatureId, string | null>>;

export function ScrollytellingSection({
  screenshots = {},
}: {
  screenshots?: ScreenshotMap;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const progress = scrollYProgress;

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative scroll-mt-16"
      /* svh (not vh) so scroll progress doesn't jump when the iOS Safari
         toolbar collapses mid-scroll. */
      style={{ height: `calc(100svh * ${FEATURE_COUNT})` }}
    >
      {/* Bottom fade mask is md+ only — on mobile it was eating the card
          stack at the bottom of the viewport. */}
      {/* Top padding must clear the sticky navbar (~57px), which overlays the
          sticky viewport. */}
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-start overflow-hidden pt-[72px] md:pt-[12vh] md:[mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]">
        {/* Headline area — reserves the height of the tallest beat so
            absolutely-positioned copy never collides with the phone. */}
        <div className="relative mb-4 w-full max-w-2xl shrink-0 px-4 text-center md:mb-10 md:px-6">
          <div className="relative min-h-[140px] md:min-h-[164px] lg:min-h-[176px]">
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

            <div className="relative z-20 mx-auto w-[150px] sm:w-[200px] md:absolute md:left-1/2 md:top-1/2 md:w-[230px] lg:w-[250px] md:-translate-x-1/2 md:-translate-y-1/2">
              <IPhoneFrame>
                <PhoneScreens progress={progress} screenshots={screenshots} />
              </IPhoneFrame>
            </div>

            {/* Mobile: compact 3-up card row under the phone (fits 375x667). */}
            <div className="relative z-10 mx-auto mt-3 min-h-[88px] w-full max-w-[360px] px-2 md:hidden">
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

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { SfSymbol } from "@/components/brand/sf-symbol";
import { cn } from "@/lib/cn";

export type ProductScreen =
  | "recipes"
  | "swipe"
  | "groceries"
  | "instore"
  | "online"
  | "cook"
  | "hero-plan"
  | "hero-groceries"
  | "hero-recipes"
  | "hero-create"
  | "hero-nutrition"
  | "hero-allergies"
  | "hero-instore"
  | "hero-cook"
  | "step-import"
  | "step-groceries"
  | "step-instore"
  | "step-online"
  | "step-cook";

type MockScreen =
  | "recipes"
  | "swipe"
  | "groceries"
  | "instore"
  | "online"
  | "cook";

/** Real simulator captures — drop PNGs in /public/screenshots/ (see README). */
const SCREENSHOTS: Partial<Record<ProductScreen, string>> = {
  "hero-plan": "/screenshots/hero-plan.png",
  "hero-groceries": "/screenshots/hero-groceries.png",
  "hero-recipes": "/screenshots/hero-recipes.png",
  "hero-create": "/screenshots/hero-create.png",
  "hero-nutrition": "/screenshots/hero-nutrition.png",
  "hero-allergies": "/screenshots/hero-allergies.png",
  "hero-instore": "/screenshots/hero-instore.png",
  "hero-cook": "/screenshots/hero-cook.png",
  "step-import": "/screenshots/step-import.png",
  "step-groceries": "/screenshots/step-groceries.png",
  "step-instore": "/screenshots/step-instore.png",
  "step-online": "/screenshots/step-online.png",
  "step-cook": "/screenshots/step-cook.png",
};

/** CSS mock used when a slot’s PNG is missing. */
const SCREENSHOT_FALLBACK: Record<ProductScreen, MockScreen> = {
  recipes: "recipes",
  swipe: "swipe",
  groceries: "groceries",
  instore: "instore",
  online: "online",
  cook: "cook",
  "hero-plan": "recipes",
  "hero-groceries": "online",
  "hero-recipes": "recipes",
  "hero-create": "recipes",
  "hero-nutrition": "recipes",
  "hero-allergies": "recipes",
  "hero-instore": "instore",
  "hero-cook": "cook",
  "step-import": "recipes",
  "step-groceries": "groceries",
  "step-instore": "instore",
  "step-online": "online",
  "step-cook": "cook",
};

/**
 * Screen mock UIs are authored for the default ~250px phone. Fixed Tailwind
 * px values would overflow at hero sizes (~100–145px), so we scale from this
 * design width to the live screen inset.
 */
const DESIGN_PHONE_WIDTH = 250;


const groceryGroups = [
  { aisle: "Fruit & veg", items: ["Lemons", "Basil", "Tomatoes"] },
  { aisle: "Cupboard", items: ["Tagliatelle", "Olive oil"] },
];

function RecipesScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] text-[#161616]">
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <div>
          <p className="text-[9px] font-semibold text-neutral-500">Your recipes</p>
          <p className="mt-0.5 text-lg font-bold tracking-tight">What sounds good?</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white">
          <SfSymbol name="line3Horizontal" size={14} />
        </div>
      </div>
      <div className="scrollbar-hide flex gap-2 overflow-hidden px-4 pb-3">
        {["Under 30 min", "One pot", "Vegetarian"].map((filter, index) => (
          <span
            key={filter}
            className={cn(
              "whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-semibold",
              index === 0 ? "border-black bg-black text-white" : "border-black/10 bg-white",
            )}
          >
            {filter}
          </span>
        ))}
      </div>
      <div className="mx-4 overflow-hidden rounded-[20px] bg-white shadow-sm">
        <div className="relative h-36 overflow-hidden bg-section-grey">
          <Image
            src="/brand/foray-kitchen-objects.png"
            alt=""
            aria-hidden="true"
            fill
            sizes="250px"
            className="object-cover object-[56%_45%] scale-[1.35]"
          />
        </div>
        <div className="p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold leading-tight">Lemony tomato pasta</p>
              <p className="mt-1 text-[9px] text-neutral-500">25 min · easy · serves 2</p>
            </div>
            <SfSymbol name="heartFill" size={16} className="shrink-0" />
          </div>
          <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-2.5 text-[10px] font-semibold text-white">
            Add to groceries <SfSymbol name="arrowRight" size={12} />
          </div>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-3 border-t border-black/5 bg-white px-4 py-3 text-center text-[8px] font-semibold text-neutral-400">
        <span className="text-black">Recipes</span>
        <span>Groceries</span>
        <span>Cook</span>
      </div>
    </div>
  );
}

function SwipeScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] px-4 pb-5 pt-5 text-[#161616]">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-[9px] font-semibold text-neutral-500">Swipe</p>
          <p className="text-lg font-bold tracking-tight">Fancy this?</p>
        </div>
        <p className="text-[9px] text-neutral-500">3 of 12</p>
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-x-3 bottom-3 top-3 rotate-3 rounded-[24px] border border-black/5 bg-white/70" />
        <div className="absolute inset-x-2 bottom-4 top-2 -rotate-2 rounded-[24px] border border-black/5 bg-white/80" />
        <div className="relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-[0_15px_35px_rgba(0,0,0,0.12)]">
          <div className="relative min-h-0 flex-1 overflow-hidden bg-section-grey">
            <Image
              src="/brand/foray-kitchen-objects.png"
              alt=""
              aria-hidden="true"
              fill
              sizes="250px"
              className="object-cover object-[18%_38%] scale-[1.55]"
            />
          </div>
          <div className="p-4">
            <p className="text-base font-bold">Tomato basil pasta</p>
            <div className="mt-1 flex items-center gap-2 text-[9px] text-neutral-500">
              <span className="flex items-center gap-1">
                <SfSymbol name="clock" size={12} /> 25 min
              </span>
              <span>Vegetarian</span>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 rounded-xl border border-black/10 py-2 text-center text-[10px] font-semibold">
                Not today
              </div>
              <div className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-black py-2 text-[10px] font-semibold text-white">
                <SfSymbol name="heartFill" size={12} /> Fork it
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GroceriesScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] text-[#161616]">
      <div className="px-4 pb-3 pt-5">
        <p className="text-[9px] font-semibold text-neutral-500">Current shop</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-lg font-bold tracking-tight">Groceries</p>
          <span className="rounded-full bg-black/5 px-2 py-1 text-[8px] font-bold text-neutral-600">
            12 items
          </span>
        </div>
      </div>
      <div className="mx-4 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
        <div className="mb-2 rounded-xl bg-section-grey px-2.5 py-2 text-[9px] font-semibold text-neutral-600">
          Duplicates combined automatically
        </div>
        {groceryGroups.map((group) => (
          <div key={group.aisle} className="mt-3">
            <p className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {group.aisle}
            </p>
            {group.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 border-t border-black/5 py-2 text-[10px] font-medium first:border-0"
              >
                <span className="h-4 w-4 rounded-full border border-black/15 bg-white" />
                {item}
                {item === "Tomatoes" && (
                  <span className="ml-auto text-[8px] text-neutral-400">2 recipes</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-auto px-4 pb-5">
        <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-3 text-[10px] font-semibold text-white">
          <SfSymbol name="cart" size={14} /> Shop this list
        </div>
        <p className="mt-2 text-center text-[8px] text-neutral-400">
          Online checkout or take it in-store
        </p>
      </div>
    </div>
  );
}

function InStoreScreen() {
  const items = [
    { name: "Lemons", aisle: "Fruit & veg", done: true },
    { name: "Basil", aisle: "Fruit & veg", done: true },
    { name: "Tomatoes", aisle: "Fruit & veg", done: false },
    { name: "Tagliatelle", aisle: "Cupboard", done: false },
    { name: "Olive oil", aisle: "Cupboard", done: false },
  ];
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] text-[#161616]">
      <div className="px-4 pb-3 pt-5">
        <p className="text-[9px] font-semibold text-neutral-500">In store</p>
        <div className="mt-1 flex items-end justify-between">
          <p className="text-lg font-bold tracking-tight">Tick as you go</p>
          <span className="rounded-full bg-black/5 px-2 py-1 text-[8px] font-bold text-neutral-600">
            2 of 5
          </span>
        </div>
      </div>
      <div className="mx-4 flex-1 overflow-hidden rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-2.5 border-t border-black/5 py-2.5 first:border-0"
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border",
                item.done
                  ? "border-black bg-black text-white"
                  : "border-black/15 bg-white",
              )}
            >
              {item.done ? <SfSymbol name="checkmark" size={10} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[10px] font-semibold",
                  item.done && "text-neutral-400 line-through",
                )}
              >
                {item.name}
              </p>
              <p className="text-[8px] text-neutral-400">{item.aisle}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="px-4 pb-5 pt-3 text-center text-[8px] text-neutral-400">
        Sorted by aisle · no checkout fee
      </p>
    </div>
  );
}

function OnlineScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] text-[#161616]">
      <div className="px-4 pb-3 pt-5">
        <p className="text-[9px] font-semibold text-neutral-500">Online checkout</p>
        <p className="mt-1 text-lg font-bold tracking-tight">Basket ready</p>
      </div>
      <div className="mx-4 rounded-2xl border border-black/5 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-2 rounded-xl bg-section-grey px-2.5 py-2">
          <SfSymbol name="cart" size={14} />
          <p className="text-[9px] font-semibold text-neutral-700">
            Sainsbury&apos;s · 12 items filled
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {["Lemony tomato pasta list", "Household · serves 4", "Ready to review"].map(
            (line) => (
              <div
                key={line}
                className="flex items-center gap-2 text-[10px] font-medium text-neutral-700"
              >
                <SfSymbol name="checkmark" size={12} className="text-black" />
                {line}
              </div>
            ),
          )}
        </div>
      </div>
      <div className="mt-auto px-4 pb-5">
        <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-black py-3 text-[10px] font-semibold text-white">
          Open retailer checkout <SfSymbol name="arrowRight" size={12} />
        </div>
        <p className="mt-2 text-center text-[8px] text-neutral-400">
          Foray fills the trolley · you confirm
        </p>
      </div>
    </div>
  );
}

function CookScreen() {
  return (
    <div className="flex h-full flex-col bg-[#f5f5f2] px-4 pb-5 pt-5 text-[#161616]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-semibold text-neutral-500">Cook mode</p>
          <p className="mt-1 text-lg font-bold tracking-tight">Tomato basil pasta</p>
        </div>
        <span className="rounded-full border border-black/10 px-2 py-1 text-[8px] text-neutral-500">
          2 of 5
        </span>
      </div>
      <div className="my-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
          <span className="text-sm font-bold">2</span>
        </div>
        <p className="mt-5 text-xl font-semibold leading-snug">
          Add the tomatoes and let them soften.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-neutral-500">
          Stir occasionally until glossy and beginning to break down.
        </p>
        <div className="mt-5 flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[10px] font-semibold">
          <SfSymbol name="clock" size={14} /> Set 8 minute timer
        </div>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 rounded-xl border border-black/10 py-2.5 text-center text-[10px] font-semibold text-neutral-500">
          Back
        </div>
        <div className="flex flex-[1.6] items-center justify-center gap-1 rounded-xl bg-black py-2.5 text-[10px] font-semibold text-white">
          Next step <SfSymbol name="checkmark" size={12} />
        </div>
      </div>
    </div>
  );
}

const screens: Record<MockScreen, React.ReactNode> = {
  recipes: <RecipesScreen />,
  swipe: <SwipeScreen />,
  groceries: <GroceriesScreen />,
  instore: <InStoreScreen />,
  online: <OnlineScreen />,
  cook: <CookScreen />,
};

/**
 * Official Apple Design Resources bezel — iPhone 17 Pro Max Silver (Portrait).
 * Source: https://developer.apple.com/design/resources/ (Bezel-iPhone-17.dmg)
 * Screen cutout measured from the transparent hole in the PNG (1320×2868).
 * Caller widths are unchanged from the Pro layout so relative size stays the same.
 */
const BEZEL = {
  src: "/brand/devices/iphone-17-pro-max-silver-portrait.png",
  /** Filled phone body (screen + chrome) for clipping the assembly to the silhouette. */
  maskSrc: "/brand/devices/iphone-17-pro-max-silhouette-mask.png",
  /** Cropped asset pixel size */
  width: 1428,
  height: 2959,
  /** Insets from phone edge to screen (px at asset resolution) */
  inset: { top: 46, right: 54, bottom: 45, left: 54 },
} as const;

const DESIGN_SCREEN_WIDTH =
  DESIGN_PHONE_WIDTH *
  (1 - (BEZEL.inset.left + BEZEL.inset.right) / BEZEL.width);

/**
 * Renders screen chrome at the design width, then scales to the live inset
 * so fixed-px mock UI stays proportional at hero sizes.
 */
function ScaledScreen({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: DESIGN_SCREEN_WIDTH, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function measure() {
      const next = el!.getBoundingClientRect();
      setBox({ w: next.width, h: next.height });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = box.w > 0 ? box.w / DESIGN_SCREEN_WIDTH : 1;
  const designHeight = scale > 0 && box.h > 0 ? box.h / scale : 0;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div
        className="origin-top-left"
        style={{
          width: DESIGN_SCREEN_WIDTH,
          height: designHeight || "100%",
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function PhoneScreen({
  screen,
  priority,
}: {
  screen: ProductScreen;
  priority: boolean;
}) {
  const src = SCREENSHOTS[screen];
  const [useMock, setUseMock] = useState(!src);

  // Remount / reset when the step or hero slide changes so a prior onError
  // (or a stale Next/Image) cannot stick on the first screenshot.
  useEffect(() => {
    setUseMock(!src);
  }, [screen, src]);

  if (!useMock && src) {
    return (
      <Image
        key={src}
        src={src}
        alt=""
        fill
        sizes="280px"
        priority={priority}
        className="bg-black object-cover object-top"
        onError={() => setUseMock(true)}
      />
    );
  }

  return (
    <ScaledScreen key={`mock-${screen}`}>
      {screens[SCREENSHOT_FALLBACK[screen]]}
    </ScaledScreen>
  );
}

export function ProductPhone({
  screen,
  className,
  priority = false,
  children,
}: {
  screen: ProductScreen;
  className?: string;
  priority?: boolean;
  /** Overlay content positioned against the phone bezel box (not the stage). */
  children?: ReactNode;
}) {
  const { inset, width, height, maskSrc } = BEZEL;

  return (
    <div className={cn("relative mx-auto w-[250px]", className)}>
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        {/* Filter outside the mask so the drop-shadow follows the silhouette */}
        <div
          className="absolute inset-0"
          style={{ filter: "drop-shadow(0 28px 48px rgba(0,0,0,0.22))" }}
        >
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: `url(${maskSrc})`,
              maskImage: `url(${maskSrc})`,
              WebkitMaskSize: "100% 100%",
              maskSize: "100% 100%",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
          >
            <div
              className="absolute overflow-hidden bg-black"
              style={{
                top: `${(inset.top / height) * 100}%`,
                right: `${(inset.right / width) * 100}%`,
                bottom: `${(inset.bottom / height) * 100}%`,
                left: `${(inset.left / width) * 100}%`,
                borderRadius: "16.4% / 7.55%",
              }}
            >
              <div className="relative h-full w-full">
                <PhoneScreen key={screen} screen={screen} priority={priority} />
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BEZEL.src}
              alt=""
              aria-hidden="true"
              width={width}
              height={height}
              decoding="async"
              {...(priority ? { fetchPriority: "high" as const } : {})}
              className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none object-contain"
            />
          </div>
        </div>

        {/* Outside mask + filter so tags can sit on/beside the bezel */}
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowDown,
  Check,
  Clock3,
  Layers3,
  Link2,
  ShoppingBasket,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ProductPhone, type ProductScreen } from "./product-phone";

interface Feature {
  eyebrow: string;
  title: string;
  body: string;
  detail: string;
  screen: ProductScreen;
  icon: React.ReactNode;
}

const FEATURES: Feature[] = [
  {
    eyebrow: "01 · Bring the recipe",
    title: "From saved link to something you can actually cook.",
    body:
      "Share a recipe from TikTok, Instagram or a food blog. Foray turns it into clear ingredients and steps, ready when you are.",
    detail: "Links, photos and your own ideas all live together.",
    screen: "recipes",
    icon: <Link2 className="h-4 w-4" />,
  },
  {
    eyebrow: "02 · Choose without overthinking",
    title: "A few good options. One easy swipe.",
    body:
      "Browse what suits your time and tastes, then fork what sounds good. No weekly spreadsheet and no pressure to plan perfectly.",
    detail: "Come back tomorrow or in two weeks. Your recipes wait.",
    screen: "swipe",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    eyebrow: "03 · One accurate shop",
    title: "Every ingredient, combined into one tidy list.",
    body:
      "Foray scales quantities, combines duplicates and groups the shop by aisle. Two recipes need tomatoes? You only see what you need.",
    detail: "Check items off in-store or take the list to online checkout.",
    screen: "groceries",
    icon: <Layers3 className="h-4 w-4" />,
  },
  {
    eyebrow: "04 · Get dinner on",
    title: "Clear steps and timers, right beside the hob.",
    body:
      "When it is time to cook, Foray keeps the recipe readable, the screen awake and your timers close at hand.",
    detail: "Less juggling. More attention for the food.",
    screen: "cook",
    icon: <Clock3 className="h-4 w-4" />,
  },
];

function FeatureCopy({
  feature,
  index,
  onActive,
}: {
  feature: Feature;
  index: number;
  onActive: (index: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { amount: 0.35, margin: "-8% 0px -8% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <article
      ref={ref}
      className="flex min-h-[68vh] flex-col justify-center py-16 lg:min-h-[78vh] lg:py-24"
    >
      <div className="mb-9 lg:hidden">
        <ProductPhone screen={feature.screen} className="w-[230px] sm:w-[260px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-dot">
          {feature.icon}
          {feature.eyebrow}
        </div>
        <h3 className="mt-5 max-w-2xl text-balance text-4xl font-bold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
          {feature.title}
        </h3>
        <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
          {feature.body}
        </p>
        <p className="mt-5 flex max-w-lg items-start gap-2 text-sm font-semibold leading-relaxed text-white/90">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-dot" />
          {feature.detail}
        </p>
      </motion.div>
    </article>
  );
}

export function ScrollytellingSection() {
  const [active, setActive] = useState(0);

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-ink text-white">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-36">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dot">
            One calm loop
          </p>
          <h2 className="mt-5 text-balance text-5xl font-bold leading-[0.96] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
            See it. Choose it. Shop it. Cook it.
          </h2>
          <p className="mt-7 max-w-2xl text-pretty text-lg leading-relaxed text-white/60">
            Foray joins the bits that usually live across saved posts, notes,
            browser tabs and shopping apps.
          </p>
          <div className="mt-9 flex items-center gap-2 text-xs font-semibold text-white/45">
            <ArrowDown className="h-4 w-4 text-brand-dot" />
            Follow a recipe from feed to fork
          </div>
        </div>

        <div className="mt-10 grid lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <div className="relative hidden lg:block">
            <div className="sticky top-28 flex h-[calc(100vh-7rem)] items-center justify-center">
              <div className="absolute h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,149,0,0.18),transparent_68%)]" />
              <div className="relative h-[600px] w-full">
                {FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature.screen}
                    aria-hidden={active !== index}
                    animate={{
                      opacity: active === index ? 1 : 0,
                      y: active === index ? 0 : 18,
                      scale: active === index ? 1 : 0.96,
                    }}
                    transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "absolute inset-0 flex items-center justify-center",
                      active !== index && "pointer-events-none",
                    )}
                  >
                    <ProductPhone screen={feature.screen} className="w-[278px]" />
                  </motion.div>
                ))}
              </div>
              <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-2">
                {FEATURES.map((feature, index) => (
                  <span
                    key={feature.screen}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      active === index ? "w-8 bg-brand-dot" : "w-1.5 bg-white/20",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            {FEATURES.map((feature, index) => (
              <FeatureCopy
                key={feature.screen}
                feature={feature}
                index={index}
                onActive={setActive}
              />
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-3 sm:p-8">
          {[
            {
              icon: <ShoppingBasket className="h-5 w-5" />,
              value: "One shop",
              label: "Recipe ingredients and everyday groceries together",
            },
            {
              icon: <Layers3 className="h-5 w-5" />,
              value: "No duplicates",
              label: "Quantities scaled and combined before you leave",
            },
            {
              icon: <Clock3 className="h-5 w-5" />,
              value: "Five taps",
              label: "The single-recipe path is designed to stay short",
            },
          ].map((item) => (
            <div key={item.value} className="rounded-2xl bg-white/[0.04] p-5">
              <div className="text-brand-dot">{item.icon}</div>
              <p className="mt-4 text-lg font-bold">{item.value}</p>
              <p className="mt-1 text-sm leading-relaxed text-white/50">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

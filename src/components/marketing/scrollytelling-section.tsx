"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";
import { ProductPhone, type ProductScreen } from "./product-phone";

interface Feature {
  eyebrow: string;
  title: string;
  body: string;
  detail: string;
  screen: ProductScreen;
}

const FEATURES: Feature[] = [
  {
    eyebrow: "01 · Bring the recipe",
    title: "From saved link to something you can actually cook.",
    body: "Share a recipe from TikTok, Instagram or a food blog. Foray turns it into clear ingredients and steps, ready when you are.",
    detail: "Links, photos and your own ideas all live together.",
    screen: "recipes",
  },
  {
    eyebrow: "02 · Choose without overthinking",
    title: "A few good options. One easy swipe.",
    body: "Browse what suits your time and tastes, then fork what sounds good. No weekly spreadsheet and no pressure to plan perfectly.",
    detail: "Come back tomorrow or in two weeks. Your recipes wait.",
    screen: "swipe",
  },
  {
    eyebrow: "03 · One accurate shop",
    title: "Every ingredient, combined into one tidy list.",
    body: "Foray scales quantities, combines duplicates and groups the shop by aisle. Two recipes need tomatoes? You only see what you need.",
    detail: "Check items off in-store or take the list to online checkout.",
    screen: "groceries",
  },
  {
    eyebrow: "04 · Get dinner on",
    title: "Clear steps and timers, right beside the hob.",
    body: "When it is time to cook, Foray keeps the recipe readable, the screen awake and your timers close at hand.",
    detail: "Less juggling. More attention for the food.",
    screen: "cook",
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
      className="flex min-h-[62vh] flex-col justify-center py-14 lg:min-h-[72vh] lg:py-20"
    >
      <div className="mb-8 lg:hidden">
        <ProductPhone screen={feature.screen} className="w-[230px] sm:w-[260px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[13px] font-semibold tracking-[-0.01em] text-muted">
          {feature.eyebrow}
        </p>
        <h3 className="mt-4 max-w-2xl text-balance text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl">
          {feature.title}
        </h3>
        <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          {feature.body}
        </p>
        <p className="mt-4 max-w-lg text-sm font-semibold leading-relaxed text-foreground/80">
          {feature.detail}
        </p>
      </motion.div>
    </article>
  );
}

export function ScrollytellingSection() {
  const [active, setActive] = useState(0);

  return (
    <section
      id="how-it-works"
      className="scroll-mt-28 bg-[#f5f5f7] text-foreground"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32">
        <div className="max-w-3xl">
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-muted">
            How it works
          </p>
          <h2 className="mt-4 text-balance text-[clamp(2.4rem,5vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.045em]">
            From saved recipe to dinner.
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-muted">
            Foray joins the bits that usually live across saved posts, notes,
            browser tabs and shopping apps — designed to stay short, about five
            taps for a single recipe.
          </p>
        </div>

        <div className="mt-12 grid lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="relative hidden lg:block">
            <div className="sticky top-28 flex h-[calc(100vh-7rem)] items-center justify-center">
              <div className="relative h-[600px] w-full">
                {FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature.screen}
                    aria-hidden={active !== index}
                    animate={{
                      opacity: active === index ? 1 : 0,
                      y: active === index ? 0 : 14,
                      scale: active === index ? 1 : 0.97,
                    }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
                      active === index
                        ? "w-7 bg-foreground"
                        : "w-1.5 bg-foreground/20",
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
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const STEPS = [
  { image: "/brand/step-import.svg", label: "Import" },
  { image: "/brand/step-swipe.svg", label: "Swipe to fork" },
  { image: "/brand/step-cart.svg", label: "Sorted cart" },
  { image: "/brand/step-checkout.svg", label: "Checkout" },
  { image: "/brand/step-cook.svg", label: "Cook" },
];

/** The five-step "recipe to dinner" promise row (renamed from `Promise` — that
 * name shadowed the global `Promise` constructor for any file importing it).
 * Thumbnails follow the Tier-2 sticker spec (see scripts/recraft-web.py). */
export function FiveClicks() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          From recipe to dinner in five clicks
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          No meal-planning spreadsheet, no juggling tabs. Foray collapses the
          whole loop into a handful of taps you can do one-handed.
        </p>

        <div className="mt-14 flex flex-col items-stretch gap-3 md:flex-row md:items-start md:justify-center md:gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-4 md:flex-col md:gap-3"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface p-2 md:h-20 md:w-20 md:p-2.5">
                <Image
                  src={step.image}
                  alt=""
                  aria-hidden="true"
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-sm font-medium text-foreground md:text-xs md:text-muted">
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

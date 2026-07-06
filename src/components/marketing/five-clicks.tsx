"use client";

import { motion } from "framer-motion";
import { Link2, Hand, ShoppingCart, CreditCard, ChefHat } from "lucide-react";

const STEPS = [
  { icon: Link2, label: "Import" },
  { icon: Hand, label: "Swipe to fork" },
  { icon: ShoppingCart, label: "Sorted cart" },
  { icon: CreditCard, label: "Checkout" },
  { icon: ChefHat, label: "Cook" },
];

/** The five-step "recipe to dinner" promise row (renamed from `Promise` — that
 * name shadowed the global `Promise` constructor for any file importing it). */
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

        <div className="mt-14 flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-center">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-center gap-3 md:flex-col md:gap-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface">
                <step.icon className="h-5 w-5 text-foreground" />
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

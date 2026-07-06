"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

/**
 * TODO: replace with real user quotes before flipping SHOW_TESTIMONIALS in
 * src/lib/site.ts. These are placeholders — publishing them would read as
 * fabricated social proof, so the section stays hidden in production until at
 * least two real TestFlight quotes exist.
 */
const QUOTES = [
  {
    quote:
      "I forked three TikTok recipes on the bus and the whole shop was sorted before my stop.",
    name: "Placeholder",
    place: "London",
    tint: "bg-surface",
  },
  {
    quote:
      "The deduped trolley is the bit that got me. Two recipes, one onion. Finally.",
    name: "Placeholder",
    place: "Manchester",
    tint: "bg-brand-dot/[0.06]",
  },
  {
    quote:
      "Meal planning used to eat my Sunday. Now it's five minutes of swiping.",
    name: "Placeholder",
    place: "Bristol",
    tint: "bg-foreground/[0.03]",
  },
  {
    quote:
      "Cook mode with timers means my phone stays clean and dinner doesn't burn.",
    name: "Placeholder",
    place: "Leeds",
    tint: "bg-surface",
  },
];

const CARD_LAYOUT = [
  "md:mt-0 md:-rotate-1",
  "md:mt-12 md:rotate-1",
  "md:mt-4 md:rotate-2",
  "md:mt-16 md:-rotate-2",
];

/** Scattered quote cards ("Tastymonials" analog) — monochrome with subtle
 * tints and initials avatars (no fake photos). Gated by SHOW_TESTIMONIALS. */
export function Testimonials() {
  return (
    <section className="overflow-hidden px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Early forks<span className="text-brand-dot">.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-center text-base leading-relaxed text-muted">
          What TestFlight cooks are saying.
        </p>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {QUOTES.map((item, i) => (
            <motion.figure
              key={item.quote}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={cn(
                "rounded-3xl border border-border p-6 shadow-sm",
                item.tint,
                CARD_LAYOUT[i % CARD_LAYOUT.length],
              )}
            >
              <blockquote className="text-sm font-semibold leading-relaxed text-foreground">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background"
                >
                  {item.name.charAt(0)}
                </span>
                <span className="text-xs text-muted">
                  {item.name}, {item.place}
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

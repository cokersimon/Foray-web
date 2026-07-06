"use client";

import { motion } from "framer-motion";

/**
 * Oversized single-statement section between the hero and the scrollytelling
 * demo (the "belief" beat of the persuasion arc — Cherrypick's "Dinner cheaper,
 * healthier…" analog, in Foray's monochrome voice).
 */
export function BigStatement() {
  return (
    <section className="px-6 py-16 md:py-24">
      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-5xl text-center text-4xl font-bold leading-[1.08] tracking-tight text-foreground md:text-6xl lg:text-7xl"
      >
        Recipes in. Groceries out. Dinner{" "}
        <span className="whitespace-nowrap">
          sorted<span className="text-brand-dot">.</span>
        </span>
      </motion.h2>
    </section>
  );
}

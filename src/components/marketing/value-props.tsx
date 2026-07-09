"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PROPS = [
  {
    image: "/brand/vp-swipe.svg",
    number: "01",
    title: "When nothing sounds obvious",
    body: "Start with a small set that fits your time and tastes. Swipe past what you do not fancy and keep the one that you do.",
  },
  {
    image: "/brand/vp-trolley.svg",
    number: "02",
    title: "When your head is already full",
    body: "Let the grocery list remember the quantities, duplicates and aisles. Add everyday essentials to the same shop.",
  },
  {
    image: "/brand/vp-clicks.svg",
    number: "03",
    title: "When dinner needs to happen now",
    body: "Open the meal, follow one clear step at a time and set named timers without leaving cook mode.",
  },
];

export function ValueProps() {
  return (
    <section className="px-5 py-24 sm:px-6 md:py-32 lg:px-10 lg:py-40">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dot">
            Built for real life
          </p>
          <h2 className="mt-5 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-foreground sm:text-6xl lg:text-7xl">
            Good plans should survive a busy week.
          </h2>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted">
            Foray reduces the decisions you need to hold in your head. Miss a
            day—or a fortnight—and everything is still there when you return.
          </p>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
        {PROPS.map((prop, i) => (
          <motion.div
            key={prop.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative flex min-h-[470px] flex-col overflow-hidden rounded-[32px] border border-border bg-surface p-7 shadow-[0_10px_40px_rgba(25,20,12,0.04)] sm:p-8"
          >
            <div className="absolute right-6 top-6 text-xs font-bold tracking-[0.16em] text-muted/60">
              {prop.number}
            </div>
            <div className="flex min-h-[230px] items-center justify-center">
              <Image
                src={prop.image}
                alt=""
                aria-hidden="true"
                width={220}
                height={220}
                className="h-44 w-44 transition-transform duration-500 ease-out group-hover:-rotate-2 group-hover:scale-105 sm:h-52 sm:w-52"
              />
            </div>
            <h3 className="mt-auto text-2xl font-bold leading-tight tracking-[-0.025em] text-foreground">
              {prop.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              {prop.body}
            </p>
          </motion.div>
        ))}
        </div>
      </div>
    </section>
  );
}

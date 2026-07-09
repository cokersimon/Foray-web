"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const STEPS = [
  { image: "/brand/step-import.svg", label: "Bring a recipe", note: "Share, browse or add your own" },
  { image: "/brand/step-swipe.svg", label: "Fork it", note: "One tap adds it to this shop" },
  { image: "/brand/step-cart.svg", label: "Check the list", note: "Scaled, combined and aisle-sorted" },
  { image: "/brand/step-checkout.svg", label: "Choose your shop", note: "Online handoff or in-store" },
  { image: "/brand/step-cook.svg", label: "Get cooking", note: "Clear steps and timers" },
];

export function FiveClicks() {
  return (
    <section className="px-5 pb-24 sm:px-6 md:pb-32 lg:px-10 lg:pb-40">
      <div className="mx-auto max-w-7xl rounded-[36px] bg-[#f1ece3] px-5 py-14 sm:px-8 md:px-12 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dot">
          Short by design
        </p>
        <h2 className="mt-4 text-balance text-4xl font-bold leading-[1] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
          Less admin between “that looks good” and dinner.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg">
          The single-recipe route is deliberately kept to five taps. Defaults
          do the remembering; you stay in control.
        </p>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative rounded-3xl border border-black/[0.06] bg-white/70 p-4 text-left backdrop-blur-sm"
            >
              <span className="absolute right-4 top-4 text-[10px] font-bold text-muted/60">
                0{i + 1}
              </span>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl p-1.5">
                <Image
                  src={step.image}
                  alt=""
                  aria-hidden="true"
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              </div>
              <h3 className="mt-4 text-sm font-bold text-foreground">{step.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{step.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

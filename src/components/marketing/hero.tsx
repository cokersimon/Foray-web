"use client";

import { motion } from "framer-motion";
import { useWaitlist } from "./waitlist-provider";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay },
});

export function Hero() {
  const { open } = useWaitlist();

  return (
    <section className="relative flex flex-col items-center px-6 pt-12 pb-32 text-center md:pt-16 lg:pt-24 lg:pb-48">
      <motion.h1
        {...fade(0.1)}
        className="max-w-4xl text-5xl font-bold leading-[1.08] tracking-tight text-foreground md:text-7xl lg:text-8xl"
      >
        Your goals, on autopilot.
      </motion.h1>

      <motion.p
        {...fade(0.25)}
        className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl"
      >
        Stop guessing. Zentra makes sense of your data, orchestrates your
        nutrition, and adapts your training in real time. Total optimisation,
        zero friction.
      </motion.p>

      <motion.div {...fade(0.4)} className="mt-12">
        <button
          onClick={open}
          className="rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Get Early Access
        </button>
      </motion.div>
    </section>
  );
}

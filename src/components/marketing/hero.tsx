"use client";

import { motion } from "framer-motion";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
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
      <motion.span
        {...fade(0)}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur-md"
      >
        Recipe to checkout in five clicks
      </motion.span>

      <motion.h1
        {...fade(0.1)}
        className="max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-8xl"
      >
        Swipe to fork<span className="text-brand-dot">.</span>
      </motion.h1>

      <motion.p
        {...fade(0.25)}
        className="mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl"
      >
        Foray turns the recipes you already love into one sorted grocery trolley
        and a five-click checkout. Built for busy, ADHD-friendly UK kitchens — no
        meal-planning spreadsheet required.
      </motion.p>

      <motion.div
        {...fade(0.4)}
        className="mt-12 flex flex-col items-center gap-3 sm:flex-row"
      >
        {APP_STORE_LIVE ? (
          <a
            href={APP_STORE_URL}
            className="rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Download on the App Store
          </a>
        ) : (
          <button
            onClick={open}
            className="rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Join the waitlist
          </button>
        )}
        <span className="text-sm text-muted">
          Free for your first week. iPhone, UK.
        </span>
      </motion.div>
    </section>
  );
}

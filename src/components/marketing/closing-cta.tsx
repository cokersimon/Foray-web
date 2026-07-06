"use client";

import { motion } from "framer-motion";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";

/** One last ask between FAQ and footer — the page should never end on
 * objection-handling. */
export function ClosingCta() {
  const { open } = useWaitlist();

  return (
    <section className="px-6 pb-24 pt-8 md:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mx-auto flex max-w-4xl flex-col items-center rounded-3xl border border-border bg-surface px-6 py-16 text-center shadow-sm md:py-20"
      >
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground md:text-5xl">
          Dinner, minus the faff<span className="text-brand-dot">.</span>
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
          Be first in line when Foray opens in the UK — recipes in, groceries
          out, five clicks to dinner.
        </p>
        <div className="mt-8">
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
        </div>
        {!APP_STORE_LIVE && (
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted">
            Coming soon to the App Store
          </p>
        )}
      </motion.div>
    </section>
  );
}

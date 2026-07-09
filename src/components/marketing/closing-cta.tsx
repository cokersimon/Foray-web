"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";

export function ClosingCta() {
  const { open } = useWaitlist();

  return (
    <section className="px-5 pb-24 pt-10 sm:px-6 md:pb-32 lg:px-10 lg:pb-40">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto flex max-w-7xl flex-col items-center overflow-hidden rounded-[40px] bg-brand-dot px-6 py-20 text-center text-black md:py-28"
      >
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full border-[55px] border-white/15" />
        <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full border-[70px] border-black/[0.06]" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-black/55">
          Launching soon in the UK
        </p>
        <h2 className="relative mt-5 max-w-4xl text-balance text-5xl font-bold leading-[0.95] tracking-[-0.055em] md:text-7xl lg:text-8xl">
          Make tonight’s dinner the easy one.
        </h2>
        <p className="relative mt-6 max-w-xl text-pretty text-base leading-relaxed text-black/65 md:text-lg">
          Join the waitlist for early access to Foray on iPhone.
        </p>
        <div className="relative mt-9">
          {APP_STORE_LIVE ? (
            <a
              href={APP_STORE_URL}
              className="marketing-button"
            >
              Download on the App Store <ArrowRight className="h-4 w-4" />
            </a>
          ) : (
            <button
              type="button"
              onClick={open}
              className="marketing-button"
            >
              Join the waitlist <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>
    </section>
  );
}

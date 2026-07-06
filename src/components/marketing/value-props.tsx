"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PROPS = [
  {
    image: "/brand/vp-swipe.svg",
    title: "Less decision fatigue",
    body: "Deciding what's for dinner is the hard part. Swipe through recipes one thumb at a time and fork the ones you fancy — no lists of links, no spreadsheet.",
  },
  {
    image: "/brand/vp-trolley.svg",
    title: "One trolley, no duplicates",
    body: "Every forked recipe rolls into a single shopping list — deduped, combined, and sorted by aisle. Two recipes that need an onion? That's one onion.",
  },
  {
    image: "/brand/vp-clicks.svg",
    title: "Five clicks, done",
    body: "Check out the whole trolley online in five clicks, or take the sorted list in-store. Then straight into hands-free cook mode with timers.",
  },
];

/** Three-column benefit translation with sticker-spec illustrations
 * (Cherrypick's "Better for you / budget / planet" analog). */
export function ValueProps() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-3 md:gap-10">
        {PROPS.map((prop, i) => (
          <motion.div
            key={prop.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex flex-col items-center text-center"
          >
            <Image
              src={prop.image}
              alt=""
              aria-hidden="true"
              width={160}
              height={160}
              className="mb-6 h-32 w-32 md:h-40 md:w-40"
            />
            <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              {prop.title}
            </h3>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted md:text-base">
              {prop.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

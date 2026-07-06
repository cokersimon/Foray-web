"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CHECKOUT_FEE_GBP } from "@/lib/site";
import { cn } from "@/lib/cn";

const FAQS = [
  {
    question: "Is Foray free to try?",
    answer:
      "Yes — your first week is free, with the whole loop included: imports, swipe planning, the sorted trolley, checkout and cook mode. After that, Foray is an in-app subscription you can manage or cancel any time in the App Store.",
  },
  {
    question: `What's the £${CHECKOUT_FEE_GBP} fee?`,
    answer: `Online checkout adds a £${CHECKOUT_FEE_GBP} convenience fee per order — that's what it costs us to hand your trolley to the supermarket. Shopping in-store with the sorted list is always free.`,
  },
  {
    question: "How does importing a recipe work?",
    answer:
      "Paste a link from TikTok, Instagram, YouTube or any food blog. Foray's AI Chef reads it and pulls out the ingredients and steps for you — usually in seconds. You can also add recipes by hand.",
  },
  {
    question: "Which supermarkets does it work with?",
    answer:
      "Foray builds your trolley at UK supermarket prices and hands it over for online checkout or an in-store shop. We're starting with major UK supermarkets and adding more — the app always shows what's available in your area.",
  },
  {
    question: "Do I need an iPhone?",
    answer:
      "For now, yes — Foray is launching on iPhone in the UK first. Join the waitlist and we'll let you know the moment that changes.",
  },
  {
    question: "How do I cancel?",
    answer:
      "In the App Store, like any other subscription — Settings, your name, Subscriptions, Foray. No emails to send, no hoops. Your plan and recipes stay put if you come back.",
  },
];

const CARD_ROTATION = [
  "md:-rotate-1",
  "md:rotate-1",
  "md:rotate-[0.5deg]",
  "md:-rotate-[0.5deg]",
  "md:rotate-1",
  "md:-rotate-1",
];

/** "Questions? Fire away." — stacked-card FAQ built on native <details> for
 * free keyboard/AT support. */
export function Faq() {
  return (
    <section id="faq" className="scroll-mt-16 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-4xl font-bold tracking-tight text-foreground md:text-6xl">
          Questions? Fire away<span className="text-brand-dot">.</span>
        </h2>

        <div className="mt-14 space-y-4">
          {FAQS.map((faq, i) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              className={cn(CARD_ROTATION[i % CARD_ROTATION.length])}
            >
              <details className="group rounded-3xl border border-border bg-surface shadow-sm open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-6 text-left text-base font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
                  />
                </summary>
                <p className="px-6 pb-6 text-sm leading-relaxed text-muted md:text-base">
                  {faq.answer}
                </p>
              </details>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { CHECKOUT_FEE_GBP } from "@/lib/site";

const FAQS = [
  {
    question: "Is Foray free to try?",
    answer:
      "Yes. Your first seven days include the full experience. After that, Foray Pro is £4.99 per month or £54.99 per year, billed through the App Store and cancellable at any time.",
  },
  {
    question: `What's the £${CHECKOUT_FEE_GBP} fee?`,
    answer: `Online checkout adds a £${CHECKOUT_FEE_GBP} convenience fee per order. That's what it costs us to hand your trolley to the supermarket, and shopping in-store with the sorted list is always free.`,
  },
  {
    question: "How does importing a recipe work?",
    answer:
      "Share or paste a link from TikTok, Instagram, YouTube or a food blog. Foray reads it and creates a structured recipe with ingredients and steps for you to check. You can also browse Foray recipes or add your own.",
  },
  {
    question: "Which supermarkets does it work with?",
    answer:
      "Foray is launching in the UK with supported retailers shown inside the app. If online checkout is not available for your chosen shop, the same aisle-sorted list still works in-store.",
  },
  {
    question: "Do I need an iPhone?",
    answer:
      "For now, yes. Foray is launching on iPhone in the UK first. Join the waitlist and we'll let you know the moment that changes.",
  },
  {
    question: "How do I cancel?",
    answer:
      "In the App Store, like any other subscription: Settings, your name, Subscriptions, Foray. No emails to send, no hoops. Your plan and recipes stay put if you come back.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 px-5 py-24 sm:px-6 md:py-32 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dot">
            Good to know
          </p>
          <h2 className="mt-5 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-foreground sm:text-6xl">
            A few useful answers<span className="text-brand-dot">.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Clear pricing, no mystery checkout rules and no hoops if you decide
            Foray is not for you.
          </p>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((faq) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4 }}
            >
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-7 text-left text-lg font-semibold tracking-tight text-foreground [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                  />
                </summary>
                <p className="max-w-2xl pb-7 pr-10 text-sm leading-relaxed text-muted md:text-base">
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

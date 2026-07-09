"use client";

import { ForayIcon } from "@/components/brand/foray-icon";
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
    <section
      id="faq"
      className="scroll-mt-24 bg-background px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
            A few useful answers<span className="text-brand-dot">.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Clear pricing, no mystery checkout rules and no hoops if you decide
            Foray is not for you.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-[28px] bg-[#f5f5f7] px-5 sm:px-8 md:px-10">
          {FAQS.map((faq, index) => (
            <details
              key={faq.question}
              className={`group ${index < FAQS.length - 1 ? "border-b border-black/[0.06]" : ""}`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-left text-lg font-semibold tracking-tight text-foreground sm:py-7 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ForayIcon
                  name="chevronDown"
                  size="row"
                  className="shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="max-w-3xl pb-6 pr-8 text-sm leading-relaxed text-muted sm:pb-7 sm:text-base">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

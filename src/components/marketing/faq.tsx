"use client";

import { SfSymbol } from "@/components/brand/sf-symbol";
import { trackFaqOpen } from "@/lib/analytics";

const FAQS = [
  {
    question: "Which supermarkets does it work with?",
    answer:
      "Foray works with Sainsbury's, Tesco and Waitrose at launch, with more to follow. If online checkout is ever unavailable at your shop, the same aisle-sorted list works in store.",
  },
  {
    question: "Where can I use Foray?",
    answer:
      "Foray is UK-first. Online checkout works at Sainsbury's, Tesco and Waitrose, and the in-store list works anywhere you shop. Europe and the US are next on the roadmap. Follow @forayapp to hear when we land.",
  },
  {
    question: "What phone do I need?",
    answer:
      "Foray is an iPhone app and needs iOS 26 or later. Android is planned, and we will announce it when it lands.",
  },
  {
    question: "How do I add recipes?",
    answer:
      "Browse hundreds of Foray recipes, or import your own from social media and cookbooks with a screenshot or photo. Foray turns it into ingredients and steps for you to check. Chef AI can also create one from whatever you fancy.",
  },
  {
    question: "Is Foray free?",
    answer:
      "Yes. Foray Free is free for as long as you like, and every new account starts with seven days of Foray Pro included. After the trial you stay on Foray Free unless you choose to subscribe.",
  },
  {
    question: "What happens after my free trial?",
    answer:
      "You move to Foray Free automatically and nothing is charged unless you choose to subscribe. You keep recipe browsing, meal planning, grocery lists, in-store shopping and cook mode. Upgrade to Pro whenever you like, from inside the app.",
  },
  {
    question: "How do I cancel?",
    answer:
      "In the App Store, like any other subscription: Settings, your name, Subscriptions, Foray. No emails to send, no hoops. Your plan and recipes stay put if you come back.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export function Faq() {
  return (
    <section
      id="faq"
      className="bg-background px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
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

        <div className="mt-12 overflow-hidden rounded-[28px] bg-section-grey px-5 sm:px-8 md:px-10">
          {FAQS.map((faq, index) => (
            <details
              key={faq.question}
              className={`group ${index < FAQS.length - 1 ? "border-b border-black/[0.06]" : ""}`}
              onToggle={(e) => {
                if (e.currentTarget.open) trackFaqOpen(faq.question);
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 text-left text-lg font-semibold tracking-tight text-foreground sm:py-7 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <SfSymbol
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

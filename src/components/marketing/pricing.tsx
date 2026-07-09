"use client";

import { ArrowRight, BadgeCheck } from "lucide-react";
import { APP_STORE_LIVE, APP_STORE_URL, CHECKOUT_FEE_GBP } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";

const INCLUDED = [
  "Recipe imports, browsing and swipe planning",
  "Deduped, aisle-sorted grocery lists",
  "In-store check-off and online checkout",
  "Step-by-step cook mode with timers",
];

export function Pricing() {
  const { open } = useWaitlist();

  return (
    <section id="pricing" className="scroll-mt-24 px-5 py-24 sm:px-6 md:py-32 lg:px-10 lg:py-40">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-dot">
            Simple pricing
          </p>
          <h2 className="mt-5 text-balance text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-foreground sm:text-6xl">
            Try the whole loop for a week.
          </h2>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            No trimmed-down trial. Plan, shop and cook with the full experience,
            then decide whether Foray has earned a place in your kitchen.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[36px] bg-foreground p-7 text-background shadow-[0_28px_80px_rgba(24,20,14,0.16)] sm:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-dot/20 blur-3xl" />
          <div className="relative">
            <div className="flex flex-col gap-5 border-b border-background/15 pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-background/55">Foray Pro</p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-[-0.05em]">£4.99</span>
                  <span className="pb-1 text-sm text-background/55">/ month</span>
                </div>
              </div>
              <div className="rounded-2xl border border-background/15 bg-background/[0.06] px-4 py-3">
                <p className="text-xs font-semibold">£54.99 yearly</p>
                <p className="mt-0.5 text-[10px] text-background/50">Save against monthly</p>
              </div>
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-relaxed text-background/80"
              >
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-dot" />
                {item}
              </li>
            ))}
            </ul>

            <div className="mt-9">
            {APP_STORE_LIVE ? (
              <a
                href={APP_STORE_URL}
                className="marketing-button marketing-button-light"
              >
                Download on the App Store <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <button
                type="button"
                onClick={open}
                className="marketing-button marketing-button-light"
              >
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </button>
            )}
            </div>
            <p className="mt-5 max-w-lg text-xs leading-relaxed text-background/45">
              Seven days free, then billed through the App Store. Online checkout
              adds a £{CHECKOUT_FEE_GBP} convenience fee per order. Taking your
              list in-store is always free.
            </p>
          {!APP_STORE_LIVE && (
            <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-background/45">
              Launching first on iPhone in the UK
            </p>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

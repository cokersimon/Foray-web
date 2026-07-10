"use client";

import { SfSymbol } from "@/components/brand/sf-symbol";
import { CHECKOUT_FEE_GBP } from "@/lib/site";
import { AppStoreBadge } from "./app-store-badge";
import { ApplePayMark } from "./apple-pay-mark";

const INCLUDED = [
  "Recipe imports, browsing and swipe planning",
  "Deduped, aisle-sorted grocery lists",
  "In-store check-off and online checkout",
  "Step-by-step cook mode with timers",
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="bg-section-grey px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        {/* Left: copy + App Store CTA — vertically centred against the orange card. */}
        <div>
          <h2 className="text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
            Try the whole loop for a week
            <span className="text-brand-dot">.</span>
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            No trimmed-down trial. Plan, shop and cook with the full experience,
            then decide whether Foray has earned a place in your kitchen.
          </p>
          <div className="mt-8">
            <AppStoreBadge />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] bg-brand-dot p-7 text-black shadow-[0_20px_60px_rgba(255,149,0,0.28)] sm:p-10">
          <div className="border-b border-black/15 pb-8">
            <p className="text-sm font-semibold text-black/55">Foray Pro</p>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-5xl font-bold tracking-[-0.045em] text-black">
                £4.99
              </span>
              <span className="text-sm text-black/55">/ month</span>
            </div>
            <p className="mt-2 text-sm text-black/65">
              or <span className="font-semibold text-black">£54.99</span> yearly
            </p>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-relaxed text-black/70"
              >
                <SfSymbol
                  name="checkmarkSealFill"
                  size="small"
                  className="mt-0.5 text-black"
                />
                <span className="text-black/80">{item}</span>
              </li>
            ))}
          </ul>

          {/* Checkout trust — Apple Pay mark lives here, not beside the App Store badge. */}
          <div className="mt-9 flex flex-col items-start gap-4 border-t border-black/15 pt-8">
            <ApplePayMark />
            <p className="max-w-lg text-left text-xs leading-relaxed text-black/55">
              Seven days free, then billed through the App Store. Online checkout
              with Apple Pay adds a £{CHECKOUT_FEE_GBP} convenience fee per
              order. Taking your list in-store is always free.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

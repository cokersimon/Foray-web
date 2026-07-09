"use client";

import { ForayIcon } from "@/components/brand/foray-icon";
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
    <section
      id="pricing"
      className="scroll-mt-28 bg-[#f5f5f7] px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div>
          <p className="text-[13px] font-semibold tracking-[-0.01em] text-muted">
            Simple pricing
          </p>
          <h2 className="mt-4 text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
            Try the whole loop for a week.
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            No trimmed-down trial. Plan, shop and cook with the full experience,
            then decide whether Foray has earned a place in your kitchen.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-black/[0.04] bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-10">
          <div className="flex flex-col gap-5 border-b border-black/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted">Foray Pro</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-[-0.045em] text-foreground">
                  £4.99
                </span>
                <span className="pb-1 text-sm text-muted">/ month</span>
              </div>
            </div>
            <div className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3">
              <p className="text-xs font-semibold text-foreground">£54.99 yearly</p>
              <p className="mt-0.5 text-[10px] text-muted">Save against monthly</p>
            </div>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-relaxed text-muted"
              >
                <ForayIcon
                  name="checkBadge"
                  size="small"
                  className="mt-0.5 text-foreground"
                />
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9">
            {APP_STORE_LIVE ? (
              <a href={APP_STORE_URL} className="marketing-button">
                Download on the App Store{" "}
                <ForayIcon name="arrowRight" size="small" />
              </a>
            ) : (
              <button type="button" onClick={open} className="marketing-button">
                Join the waitlist <ForayIcon name="arrowRight" size="small" />
              </button>
            )}
          </div>
          <p className="mt-5 max-w-lg text-xs leading-relaxed text-muted">
            Seven days free, then billed through the App Store. Online checkout
            adds a £{CHECKOUT_FEE_GBP} convenience fee per order. Taking your
            list in-store is always free.
          </p>
          {!APP_STORE_LIVE && (
            <p className="mt-4 text-[11px] font-semibold tracking-[-0.01em] text-muted">
              Launching first on iPhone in the UK
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

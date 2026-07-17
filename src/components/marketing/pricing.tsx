"use client";

import { SfSymbol } from "@/components/brand/sf-symbol";
import type { FormattedPricing } from "@/lib/pricing";
import { AppStoreBadge } from "./app-store-badge";
import { ApplePayMark } from "./apple-pay-mark";

type Cell = "check" | "dash";

const FEATURES: { label: string; note?: boolean; free: Cell; pro: Cell }[] = [
  {
    label: "Browse Foray recipes and swipe planning",
    free: "check",
    pro: "check",
  },
  {
    label: "Import recipes from TikTok, Instagram and the web",
    free: "dash",
    pro: "check",
  },
  {
    label: "Create your own recipes from a photo or screenshot",
    free: "dash",
    pro: "check",
  },
  { label: "Chef AI and Siri", free: "dash", pro: "check" },
  {
    label: "Snap your pantry for recipe ideas",
    free: "dash",
    pro: "check",
  },
  { label: "Household serving scaling", free: "check", pro: "check" },
  {
    label: "Deduped, aisle-sorted grocery lists",
    free: "check",
    pro: "check",
  },
  { label: "In-store shopping", free: "check", pro: "check" },
  {
    label: "Online checkout at Sainsbury's, Tesco and Waitrose",
    note: true,
    free: "check",
    pro: "check",
  },
  {
    label: "Step-by-step cook mode with timers",
    free: "check",
    pro: "check",
  },
];

function CellMark({ value }: { value: Cell }) {
  if (value === "check") {
    return (
      <span aria-label="Included" className="inline-flex">
        <SfSymbol name="checkmarkSealFill" size="small" className="text-black" />
      </span>
    );
  }
  return (
    <span
      className="text-base font-medium leading-none text-black/35"
      aria-label="Not included"
    >
      −
    </span>
  );
}

export function Pricing({ pricing }: { pricing: FormattedPricing }) {
  return (
    <section
      id="pricing"
      className="bg-section-grey px-(--gutter) py-[clamp(5rem,2.9375rem+8.5vw,8rem)]"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-y-12 motion-safe:transition-[column-gap] motion-safe:duration-200 motion-safe:ease-out desk:grid-cols-[0.85fr_1.15fr] desk:gap-x-20">
        <div className="text-center desk:text-left">
          <h2 className="text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
            Foray Pro, free for your first week
            <span className="text-brand-dot">.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted desk:mx-0">
            Seven days with everything unlocked, no trimmed down trial. Don&apos;t
            want to keep Pro? Cancel before the trial ends and stay on Foray Free
            for as long as you like.
          </p>
          <div className="mt-8 flex justify-center desk:justify-start">
            <AppStoreBadge location="pricing" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[32px] bg-brand-dot p-5 text-black shadow-[0_20px_60px_rgba(255,149,0,0.28)] sm:p-8 md:p-10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-black/15">
                  <th scope="col" className="pb-5 pr-3 text-left align-bottom">
                    <span className="block text-sm font-semibold tracking-tight text-black sm:text-base">
                      Features
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="w-16 px-1 pb-5 text-center align-bottom sm:w-20"
                  >
                    <span className="block text-sm font-semibold tracking-tight text-black sm:text-base">
                      Free
                    </span>
                  </th>
                  <th
                    scope="col"
                    className="w-16 px-1 pb-5 text-center align-bottom sm:w-20"
                  >
                    <span className="block text-sm font-semibold tracking-tight text-black sm:text-base">
                      Pro
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-black/[0.08] last:border-b-0"
                  >
                    <th
                      scope="row"
                      className="py-3 pr-3 text-left text-xs font-medium leading-snug text-black/80 sm:text-sm sm:leading-relaxed"
                    >
                      {row.label}
                      {row.note ? (
                        <span className="text-black/55" aria-hidden="true">
                          *
                        </span>
                      ) : null}
                    </th>
                    <td className="px-1 py-3 text-center align-middle">
                      <span className="inline-flex justify-center">
                        <CellMark value={row.free} />
                      </span>
                    </td>
                    <td className="px-1 py-3 text-center align-middle">
                      <span className="inline-flex justify-center">
                        <CellMark value={row.pro} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center gap-5 border-t border-black/15 pt-6 sm:gap-6">
            <p className="min-w-0 flex-1 text-left text-xs leading-relaxed text-black/55">
              Try Foray Pro free for 7 days. Then {pricing.monthly}/month for 12
              months, or {pricing.upFront} once for the year. Billed through the
              App Store. Cancel anytime and it won&apos;t renew after your
              current billing period. * Online checkout:{" "}
              {pricing.convenienceFee} per order on both plans.
            </p>
            <ApplePayMark />
          </div>
        </div>
      </div>
    </section>
  );
}

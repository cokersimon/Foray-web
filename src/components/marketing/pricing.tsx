"use client";

import { BadgeCheck } from "lucide-react";
import { APP_STORE_LIVE, APP_STORE_URL, CHECKOUT_FEE_GBP } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";

const INCLUDED = [
  "Unlimited recipe imports from social media and food blogs",
  "Swipe planning and your weekly plan",
  "Deduped, aisle-sorted shopping lists",
  "In-store check-off and online checkout",
  "Hands-free cook mode with timers",
];

export function Pricing() {
  const { open } = useWaitlist();

  return (
    <section id="pricing" className="scroll-mt-16 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-xl">
        <div className="rounded-3xl border border-border bg-surface p-8 text-center md:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Start free for a week
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted">
            Try the whole loop free for your first week. After that, keep Foray
            with an in-app subscription you can manage or cancel any time in
            the App Store. Online checkout adds a £{CHECKOUT_FEE_GBP}{" "}
            convenience fee per order, and shopping in-store is always free.
          </p>

          <ul className="mx-auto mt-8 max-w-xs space-y-3 text-left">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-foreground"
              >
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-dot" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            {APP_STORE_LIVE ? (
              <a
                href={APP_STORE_URL}
                className="inline-block rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Download on the App Store
              </a>
            ) : (
              <button
                onClick={open}
                className="rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Join the waitlist
              </button>
            )}
          </div>
          {!APP_STORE_LIVE && (
            <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted">
              Coming soon to the App Store
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

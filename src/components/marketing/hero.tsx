"use client";

import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";

/**
 * Above-the-fold entrances are CSS keyframes (`animate-rise` in globals.css),
 * not Framer Motion — Framer's initial={{opacity:0}} serializes into the SSR
 * HTML and ships an invisible LCP until hydration. `motion-safe:` keeps the
 * hero static (and fully visible) for reduced-motion users.
 */
const riseDelay = (delaySeconds: number) => ({
  animationDelay: `${delaySeconds}s`,
});

export function Hero() {
  const { open } = useWaitlist();

  return (
    <section className="relative flex flex-col items-center px-6 pt-16 pb-32 text-center md:pt-20 lg:pt-28 lg:pb-48">
      <h1
        style={riseDelay(0)}
        className="motion-safe:animate-rise max-w-4xl text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-7xl lg:text-8xl"
      >
        Swipe to fork<span className="text-brand-dot">.</span>
      </h1>

      <p
        style={riseDelay(0.15)}
        className="motion-safe:animate-rise mt-8 max-w-xl text-lg leading-relaxed text-muted md:text-xl"
      >
        Foray turns the recipes you love into one sorted grocery trolley and a
        five-click checkout. Busy-proof, ADHD friendly, and no meal-planning
        spreadsheet in sight.
      </p>

      <div
        style={riseDelay(0.3)}
        className="motion-safe:animate-rise mt-12"
      >
        {APP_STORE_LIVE ? (
          <a
            href={APP_STORE_URL}
            className="rounded-full bg-foreground px-8 py-4 text-sm font-medium text-background transition-opacity hover:opacity-90"
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

      <p
        style={riseDelay(0.4)}
        className="motion-safe:animate-rise mt-6 text-xs font-medium uppercase tracking-widest text-muted"
      >
        Recipe to checkout in five clicks
      </p>
    </section>
  );
}

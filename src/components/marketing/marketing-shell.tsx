"use client";

import { MotionConfig, useReducedMotion } from "framer-motion";
import { TickerBar } from "./ticker-bar";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { WaitlistProvider } from "./waitlist-provider";
import { WaitlistModal } from "./waitlist-modal";
import { CookieBanner } from "./cookie-banner";
import { SmoothScrollProvider } from "./smooth-scroll-provider";

/**
 * Shared chrome for every marketing page: waitlist context, motion config
 * (honours prefers-reduced-motion), Lenis smooth scroll (skipped entirely for
 * reduced-motion users — Lenis has no built-in handling), navbar and footer.
 * Admin/auth routes never render this shell.
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <>
      <TickerBar />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WaitlistModal />
      <CookieBanner />
    </>
  );

  return (
    <WaitlistProvider>
      <MotionConfig reducedMotion="user">
        {prefersReducedMotion ? (
          content
        ) : (
          <SmoothScrollProvider>{content}</SmoothScrollProvider>
        )}
      </MotionConfig>
    </WaitlistProvider>
  );
}

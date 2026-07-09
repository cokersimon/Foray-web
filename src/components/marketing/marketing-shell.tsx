"use client";

import { MotionConfig, useReducedMotion } from "framer-motion";
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
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[120] -translate-y-24 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="pt-16 sm:pt-20">
        {children}
      </main>
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

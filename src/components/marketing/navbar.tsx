"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { Wordmark } from "@/components/brand/wordmark";
import { SfSymbol } from "@/components/brand/sf-symbol";
import { AppStoreBadge } from "./app-store-badge";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

/** Ignore tiny trackpad jitter when deciding scroll direction. */
const DIRECTION_THRESHOLD_PX = 8;
/** Hide the bar after this much downward travel (still fairly snappy). */
const HIDE_DISTANCE_PX = 24;
/**
 * Reveal only after a meaningful upward swipe — about one solid flick —
 * so small page adjustments do not pop the toolbar back.
 */
const REVEAL_DISTANCE_PX = 110;
/** Keep the bar visible while near the very top of the page. */
const TOP_REVEAL_PX = 24;
/** How long to ignore direction updates during a nav jump. */
const JUMP_LOCK_MS = 1200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Absolute document Y of an element's top edge. */
function sectionTopY(el: HTMLElement) {
  const current = window.scrollY || document.documentElement.scrollTop;
  return Math.max(0, Math.round(el.getBoundingClientRect().top + current));
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const lenis = useLenis();
  const lastY = useRef(0);
  /** Accumulated travel in the current direction before hide/reveal fires. */
  const travelY = useRef(0);
  const jumpLock = useRef(false);
  const jumpTimer = useRef<number | null>(null);
  const didHashScroll = useRef(false);
  const menuOpenRef = useRef(menuOpen);
  const navHiddenRef = useRef(navHidden);
  menuOpenRef.current = menuOpen;
  navHiddenRef.current = navHidden;

  useEffect(() => {
    lastY.current = window.scrollY || document.documentElement.scrollTop;
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    travelY.current = 0;
    setNavHidden(false);
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep CSS scroll-padding in sync. When the bar is hidden, land flush at 0.
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>("[data-site-header-bar]");
    if (!bar) return;

    function sync() {
      if (navHidden && !menuOpen) {
        document.documentElement.style.setProperty("--site-header-offset", "0px");
        return;
      }
      const height = bar!.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--site-header-offset",
        `${Math.ceil(height)}px`,
      );
    }

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(bar);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [navHidden, menuOpen]);

  function applyScrollY(y: number) {
    if (jumpLock.current || menuOpenRef.current) {
      lastY.current = y;
      travelY.current = 0;
      return;
    }

    if (y <= TOP_REVEAL_PX) {
      travelY.current = 0;
      setNavHidden(false);
      lastY.current = y;
      return;
    }

    const delta = y - lastY.current;
    if (Math.abs(delta) < DIRECTION_THRESHOLD_PX) return;

    // Same direction as current travel → accumulate; reverse → reset.
    if ((delta > 0 && travelY.current >= 0) || (delta < 0 && travelY.current <= 0)) {
      travelY.current += delta;
    } else {
      travelY.current = delta;
    }
    lastY.current = y;

    if (!navHiddenRef.current && travelY.current >= HIDE_DISTANCE_PX) {
      travelY.current = 0;
      setNavHidden(true);
      return;
    }

    if (navHiddenRef.current && travelY.current <= -REVEAL_DISTANCE_PX) {
      travelY.current = 0;
      setNavHidden(false);
    }
  }

  // Hide on scroll down, reveal on scroll up (native / mobile; Lenis below).
  useEffect(() => {
    function onWindowScroll() {
      applyScrollY(window.scrollY || document.documentElement.scrollTop);
    }
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
  }, []);

  useLenis((instance) => {
    applyScrollY(instance.scroll);
  });

  function clearJumpTimer() {
    if (jumpTimer.current != null) {
      window.clearTimeout(jumpTimer.current);
      jumpTimer.current = null;
    }
  }

  function beginJumpLock(ms: number) {
    jumpLock.current = true;
    travelY.current = 0;
    clearJumpTimer();
    jumpTimer.current = window.setTimeout(() => {
      jumpLock.current = false;
      jumpTimer.current = null;
      travelY.current = 0;
      lastY.current = window.scrollY || document.documentElement.scrollTop;
      lenis?.start();
    }, ms);
  }

  function scrollToSectionTop(el: HTMLElement) {
    const reduceMotion = prefersReducedMotion();
    const y = sectionTopY(el);

    document.body.style.overflow = "";
    setMenuOpen(false);
    setNavHidden(true);

    lenis?.stop();
    beginJumpLock(reduceMotion ? 80 : JUMP_LOCK_MS);

    // Double-rAF so the hide transform starts before the jump.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({
          top: sectionTopY(el) || y,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      });
    });
  }

  // Land correctly on deep links like /#pricing (once).
  useEffect(() => {
    if (didHashScroll.current) return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;

    const id = window.setTimeout(() => {
      didHashScroll.current = true;
      scrollToSectionTop(el);
    }, 80);

    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenis]);

  useEffect(() => () => clearJumpTimer(), []);

  function onNavLinkClick(href: string) {
    const id = href.includes("#") ? href.split("#")[1] : null;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    scrollToSectionTop(el);
    window.history.pushState(null, "", href);
  }

  const barHidden = navHidden && !menuOpen;

  return (
    <>
      <header
        className={cn(
          "pointer-events-none fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          barHidden ? "-translate-y-full" : "translate-y-0",
        )}
      >
        <div
          className={cn(
            "pointer-events-auto relative z-50 mx-auto max-w-[1600px] transition-[background-color,border-radius,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            menuOpen
              ? "rounded-b-[2rem] bg-ink text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:rounded-b-[2.5rem] md:rounded-none md:border-b md:border-black/5 md:bg-[rgba(255,255,255,0.48)] md:text-foreground md:shadow-none md:backdrop-blur-[16px] md:backdrop-saturate-150"
              : "toolbar-frost",
          )}
        >
          <div
            data-site-header-bar
            className="flex items-center justify-between px-5 py-3 sm:px-6 md:px-10 md:py-4"
          >
            <Link
              href="/"
              className="shrink-0 rounded-sm transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
              onClick={() => setMenuOpen(false)}
            >
              <Wordmark
                className={cn(
                  "text-2xl tracking-tighter transition-colors",
                  menuOpen && "text-white md:text-foreground",
                )}
              />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavLinkClick(link.href);
                  }}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
                >
                  {link.label}
                </a>
              ))}
              <AppStoreBadge size="compact" variant="white" className="ml-1" />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <AppStoreBadge size="compact" variant="white" />
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className={cn(
                  "glass-chip relative flex h-10 w-10 items-center justify-center",
                  menuOpen && "glass-chip-on-dark",
                )}
              >
                <span className="relative block h-5 w-5">
                  <SfSymbol
                    name="line3Horizontal"
                    size="small"
                    className={cn(
                      "absolute inset-0 m-auto transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      menuOpen
                        ? "scale-75 rotate-90 opacity-0"
                        : "scale-100 rotate-0 opacity-100",
                    )}
                  />
                  <SfSymbol
                    name="xmark"
                    size="small"
                    className={cn(
                      "absolute inset-0 m-auto transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      menuOpen
                        ? "scale-100 rotate-0 opacity-100"
                        : "scale-75 -rotate-90 opacity-0",
                    )}
                  />
                </span>
              </button>
            </div>
          </div>

          {/*
            Use max-height (not 0fr/1fr). In an auto-sized header, 1fr resolves
            to 0px so the panel never expands and the backdrop eats every tap.
          */}
          <div
            className={cn(
              "overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
              menuOpen
                ? "max-h-[28rem] opacity-100"
                : "pointer-events-none max-h-0 opacity-0",
            )}
          >
            <nav
              aria-label="Mobile"
              className="relative z-50 flex flex-col gap-1 px-5 pb-8 pt-2 sm:px-6"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavLinkClick(link.href);
                  }}
                  className="rounded-2xl px-3 py-3.5 text-left text-[1.65rem] font-semibold leading-none tracking-tight text-white transition-colors hover:bg-white/10"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/25 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}

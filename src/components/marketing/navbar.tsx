"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { Wordmark } from "@/components/brand/wordmark";
import { SfSymbol } from "@/components/brand/sf-symbol";
import { AppStoreBadge } from "./app-store-badge";
import { trackNavClick } from "@/lib/analytics";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

/** Ignore tiny trackpad / touch jitter when reading direction. */
const DIRECTION_THRESHOLD_PX = 2;
/**
 * Once the bar is fully off-screen, this much upward travel maps linearly
 * from hidden → visible (mobile). Feels like the chrome easing back in
 * with the finger, not a timed CSS snap.
 */
const REVEAL_DISTANCE_MOBILE_PX = 100;
/** Longer upward travel on laptop / desktop trackpads before fully shown. */
const REVEAL_DISTANCE_DESKTOP_PX = 180;
/** Keep the bar pinned while near the very top of the page. */
const TOP_REVEAL_PX = 24;
/** How long to ignore direction updates during a nav jump. */
const JUMP_LOCK_MS = 1200;

const COARSE_POINTER = "(hover: none), (pointer: coarse)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function revealDistancePx() {
  return window.matchMedia(COARSE_POINTER).matches
    ? REVEAL_DISTANCE_MOBILE_PX
    : REVEAL_DISTANCE_DESKTOP_PX;
}

/** Absolute document Y of an element's top edge. */
function sectionTopY(el: HTMLElement) {
  const current = window.scrollY || document.documentElement.scrollTop;
  return Math.max(0, Math.round(el.getBoundingClientRect().top + current));
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  /** True only when the bar is fully translated off-screen (for scroll-padding). */
  const [navHidden, setNavHidden] = useState(false);
  const lenis = useLenis();
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  /** 0 = fully visible, barHeight = fully hidden. Scroll-linked, not CSS-tweened. */
  const offsetY = useRef(0);
  const barHeight = useRef(64);
  /**
   * Upward travel accumulated while fully hidden. Maps 0→revealDistance onto
   * the reveal; reset when the user scrolls down again.
   */
  const revealTravel = useRef(0);
  const jumpLock = useRef(false);
  const jumpTimer = useRef<number | null>(null);
  const didHashScroll = useRef(false);
  const menuOpenRef = useRef(menuOpen);
  menuOpenRef.current = menuOpen;

  function syncHeaderOffsetCss(fullyHidden: boolean) {
    if (fullyHidden && !menuOpenRef.current) {
      document.documentElement.style.setProperty("--site-header-offset", "0px");
      return;
    }
    const height =
      barRef.current?.getBoundingClientRect().height ?? barHeight.current;
    document.documentElement.style.setProperty(
      "--site-header-offset",
      `${Math.ceil(height)}px`,
    );
  }

  function applyOffset(next: number, { snapHidden }: { snapHidden?: boolean } = {}) {
    const height = Math.max(1, barHeight.current);
    const clamped = Math.min(height, Math.max(0, next));
    offsetY.current = clamped;

    const el = headerRef.current;
    if (el) {
      el.style.transform = `translate3d(0, ${-clamped}px, 0)`;
    }

    const fullyHidden =
      snapHidden ?? clamped >= height - 0.5;
    setNavHidden((prev) => {
      if (prev === fullyHidden) return prev;
      syncHeaderOffsetCss(fullyHidden);
      return fullyHidden;
    });
  }

  useEffect(() => {
    lastY.current = window.scrollY || document.documentElement.scrollTop;
    const measure = () => {
      const h = barRef.current?.getBoundingClientRect().height;
      if (h && h > 0) barHeight.current = h;
    };
    measure();
    applyOffset(0);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    revealTravel.current = 0;
    applyOffset(0);
    return () => {
      document.body.style.overflow = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Keep CSS scroll-padding + bar height in sync.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    function sync() {
      const height = bar!.getBoundingClientRect().height;
      if (height > 0) barHeight.current = height;
      // If we were fully hidden, keep offset pinned to the new height.
      if (offsetY.current >= barHeight.current - 0.5) {
        applyOffset(barHeight.current, { snapHidden: true });
      }
      syncHeaderOffsetCss(navHidden && !menuOpen);
    }

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(bar);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navHidden, menuOpen]);

  function applyScrollY(y: number) {
    if (jumpLock.current || menuOpenRef.current) {
      lastY.current = y;
      return;
    }

    if (y <= TOP_REVEAL_PX) {
      revealTravel.current = 0;
      applyOffset(0);
      lastY.current = y;
      return;
    }

    const delta = y - lastY.current;
    if (Math.abs(delta) < DIRECTION_THRESHOLD_PX) return;
    lastY.current = y;

    const height = Math.max(1, barHeight.current);
    const reduceMotion = prefersReducedMotion();

    // Scroll down — bar rides away with the page (1:1), then stays off.
    if (delta > 0) {
      revealTravel.current = 0;
      if (reduceMotion) {
        applyOffset(height, { snapHidden: true });
        return;
      }
      applyOffset(offsetY.current + delta);
      return;
    }

    // Scroll up — progressive reveal.
    const up = -delta;

    if (reduceMotion) {
      revealTravel.current += up;
      if (revealTravel.current >= revealDistancePx()) {
        revealTravel.current = 0;
        applyOffset(0);
      }
      return;
    }

    const fullyHidden = offsetY.current >= height - 0.5;
    // From fully hidden (or mid progressive reveal): map ~100px of upward
    // travel onto the full slide-in. Stay in this mode until shown or the
    // user scrolls down again — don't flip to 1:1 after the first frame.
    if (fullyHidden || revealTravel.current > 0) {
      const distance = revealDistancePx();
      revealTravel.current = Math.min(distance, revealTravel.current + up);
      const t = revealTravel.current / distance;
      applyOffset(height * (1 - t));
      if (t >= 1) {
        revealTravel.current = 0;
        applyOffset(0);
      }
      return;
    }

    // Partially tucked from a downward scroll — keep tracking 1:1.
    applyOffset(offsetY.current - up);
  }

  // Hide on scroll down, reveal on scroll up (native / mobile; Lenis below).
  useEffect(() => {
    function onWindowScroll() {
      applyScrollY(window.scrollY || document.documentElement.scrollTop);
    }
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    revealTravel.current = 0;
    clearJumpTimer();
    jumpTimer.current = window.setTimeout(() => {
      jumpLock.current = false;
      jumpTimer.current = null;
      revealTravel.current = 0;
      lastY.current = window.scrollY || document.documentElement.scrollTop;
      lenis?.start();
    }, ms);
  }

  function scrollToSectionTop(el: HTMLElement) {
    const reduceMotion = prefersReducedMotion();
    const y = sectionTopY(el);

    document.body.style.overflow = "";
    setMenuOpen(false);
    revealTravel.current = 0;
    applyOffset(barHeight.current, { snapHidden: true });

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
    trackNavClick(id);
    scrollToSectionTop(el);
    window.history.pushState(null, "", href);
  }

  return (
    <>
      <header
        ref={headerRef}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 will-change-transform"
        style={{ transform: "translate3d(0, 0, 0)" }}
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
            ref={barRef}
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
              <AppStoreBadge
                size="compact"
                variant="white"
                location="nav"
                className="ml-1"
              />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <AppStoreBadge size="compact" variant="white" location="nav" />
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

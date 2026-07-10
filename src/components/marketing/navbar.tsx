"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { Wordmark } from "@/components/brand/wordmark";
import { SfSymbol } from "@/components/brand/sf-symbol";
import { trackDownloadApp, trackNavClick } from "@/lib/analytics";
import { APP_STORE_URL } from "@/lib/site";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

/** Ignore tiny trackpad / touch jitter when reading direction. */
const DIRECTION_THRESHOLD_PX = 1.5;
/**
 * Once fully hidden, this much upward travel maps onto the reveal.
 * Visual motion is lerped so large Lenis/trackpad steps stay smooth.
 */
const REVEAL_DISTANCE_MOBILE_PX = 90;
const REVEAL_DISTANCE_DESKTOP_PX = 140;
/** Keep the bar pinned while near the very top of the page. */
const TOP_REVEAL_PX = 16;
/** How long to ignore direction updates during a nav jump. */
const JUMP_LOCK_MS = 1200;
/** Visual lerp — lower = silkier (desktop), higher = snappier (touch). */
const LERP_MOBILE = 0.28;
const LERP_DESKTOP = 0.16;

const COARSE_POINTER = "(hover: none), (pointer: coarse)";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isCoarsePointer() {
  return window.matchMedia(COARSE_POINTER).matches;
}

function revealDistancePx() {
  return isCoarsePointer()
    ? REVEAL_DISTANCE_MOBILE_PX
    : REVEAL_DISTANCE_DESKTOP_PX;
}

function lerpFactor() {
  return isCoarsePointer() ? LERP_MOBILE : LERP_DESKTOP;
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
  /** Desired hide amount (0 visible → barHeight hidden). */
  const targetOffset = useRef(0);
  /** Painted hide amount — lerps toward target for smooth in/out. */
  const visualOffset = useRef(0);
  const barHeight = useRef(64);
  const revealTravel = useRef(0);
  const rafId = useRef<number | null>(null);
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

  function paintOffset(px: number) {
    const el = headerRef.current;
    if (el) {
      el.style.transform = `translate3d(0, ${-px}px, 0)`;
    }
    const height = Math.max(1, barHeight.current);
    const fullyHidden = px >= height - 0.5;
    setNavHidden((prev) => {
      if (prev === fullyHidden) return prev;
      syncHeaderOffsetCss(fullyHidden);
      return fullyHidden;
    });
  }

  function tickLerp() {
    rafId.current = null;
    const height = Math.max(1, barHeight.current);
    const target = Math.min(height, Math.max(0, targetOffset.current));
    targetOffset.current = target;

    const diff = target - visualOffset.current;
    if (Math.abs(diff) < 0.2 || prefersReducedMotion()) {
      visualOffset.current = target;
      paintOffset(target);
      return;
    }

    visualOffset.current += diff * lerpFactor();
    paintOffset(visualOffset.current);
    rafId.current = window.requestAnimationFrame(tickLerp);
  }

  function setTargetOffset(
    next: number,
    { immediate = false }: { immediate?: boolean } = {},
  ) {
    const height = Math.max(1, barHeight.current);
    const clamped = Math.min(height, Math.max(0, next));
    targetOffset.current = clamped;

    if (immediate || prefersReducedMotion()) {
      if (rafId.current != null) {
        window.cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      visualOffset.current = clamped;
      paintOffset(clamped);
      return;
    }

    if (rafId.current == null) {
      rafId.current = window.requestAnimationFrame(tickLerp);
    }
  }

  useEffect(() => {
    lastY.current = window.scrollY || document.documentElement.scrollTop;
    const measure = () => {
      const h = barRef.current?.getBoundingClientRect().height;
      if (h && h > 0) barHeight.current = h;
    };
    measure();
    setTargetOffset(0, { immediate: true });
    return () => {
      if (rafId.current != null) window.cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    revealTravel.current = 0;
    setTargetOffset(0, { immediate: true });
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
      if (targetOffset.current >= barHeight.current - 0.5) {
        setTargetOffset(barHeight.current, { immediate: true });
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
      setTargetOffset(0);
      lastY.current = y;
      return;
    }

    const delta = y - lastY.current;
    if (Math.abs(delta) < DIRECTION_THRESHOLD_PX) return;
    lastY.current = y;

    const height = Math.max(1, barHeight.current);
    const reduceMotion = prefersReducedMotion();

    // Scroll down — tuck away with the page.
    if (delta > 0) {
      revealTravel.current = 0;
      if (reduceMotion) {
        setTargetOffset(height, { immediate: true });
        return;
      }
      setTargetOffset(targetOffset.current + delta);
      return;
    }

    // Scroll up — progressive reveal from fully hidden, else 1:1.
    const up = -delta;

    if (reduceMotion) {
      revealTravel.current += up;
      if (revealTravel.current >= revealDistancePx()) {
        revealTravel.current = 0;
        setTargetOffset(0, { immediate: true });
      }
      return;
    }

    const fullyHidden = targetOffset.current >= height - 0.5;
    if (fullyHidden || revealTravel.current > 0) {
      const distance = revealDistancePx();
      revealTravel.current = Math.min(distance, revealTravel.current + up);
      const t = revealTravel.current / distance;
      setTargetOffset(height * (1 - t));
      if (t >= 1) {
        revealTravel.current = 0;
        setTargetOffset(0);
      }
      return;
    }

    setTargetOffset(targetOffset.current - up);
  }

  // One scroll source only: Lenis on desktop, native window scroll on touch.
  // Listening to both made the bar fight itself and feel jumpy on laptops.
  useEffect(() => {
    if (lenis) return;
    function onWindowScroll() {
      applyScrollY(window.scrollY || document.documentElement.scrollTop);
    }
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", onWindowScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lenis]);

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
    setTargetOffset(barHeight.current, { immediate: true });

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
              <a
                href={APP_STORE_URL}
                onClick={() => trackDownloadApp("nav")}
                className="marketing-button marketing-button-compact ml-1"
              >
                Get Foray
              </a>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <a
                href={APP_STORE_URL}
                onClick={() => trackDownloadApp("nav")}
                className={cn(
                  "marketing-button marketing-button-compact",
                  menuOpen && "marketing-button-on-dark",
                )}
              >
                Download
              </a>
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

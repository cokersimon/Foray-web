"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLenis } from "lenis/react";
import { Wordmark } from "@/components/brand/wordmark";
import { ForayIcon } from "@/components/brand/foray-icon";
import { useWaitlist } from "./waitlist-provider";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

/** Extra breathing room below the fixed toolbar when a section lands. */
const SECTION_GAP_PX = 16;

function getToolbarOffset(): number {
  const bar = document.querySelector<HTMLElement>("[data-site-header-bar]");
  const height = bar?.getBoundingClientRect().height ?? 64;
  return -(Math.ceil(height) + SECTION_GAP_PX);
}

export function Navbar() {
  const { open } = useWaitlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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

  // Keep CSS scroll-padding in sync with the real toolbar height.
  useEffect(() => {
    const bar = document.querySelector<HTMLElement>("[data-site-header-bar]");
    if (!bar) return;

    function sync() {
      const height = bar!.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--site-header-offset",
        `${Math.ceil(height) + SECTION_GAP_PX}px`,
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
  }, []);

  // Land correctly on deep links like /#pricing (after layout + toolbar measure).
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const offset = getToolbarOffset();

    const id = window.setTimeout(() => {
      if (lenis) {
        lenis.scrollTo(el, { offset, duration: reduceMotion ? 0 : 1.15 });
      } else {
        const top =
          el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({
          top,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      }
    }, 50);

    return () => window.clearTimeout(id);
  }, [lenis]);

  function scrollToSection(href: string) {
    const id = href.includes("#") ? href.split("#")[1] : null;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;

    const wasMenuOpen = menuOpen;
    setMenuOpen(false);

    const run = () => {
      const offset = getToolbarOffset();
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (lenis) {
        lenis.scrollTo(el, {
          offset,
          duration: reduceMotion ? 0 : 1.15,
        });
        return;
      }

      const top =
        el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({
        top,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    // Wait for the open-menu panel to collapse so we measure the closed toolbar.
    if (wasMenuOpen) {
      window.setTimeout(run, 320);
    } else {
      requestAnimationFrame(() => requestAnimationFrame(run));
    }
  }

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "pointer-events-auto mx-auto max-w-[1600px] transition-[background-color,border-radius,box-shadow,backdrop-filter] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
                    scrollToSection(link.href);
                    window.history.pushState(null, "", link.href);
                  }}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
                >
                  {link.label}
                </a>
              ))}
              <button
                type="button"
                onClick={open}
                className="marketing-button marketing-button-compact ml-1"
              >
                Join Waitlist
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={open}
                className={cn(
                  "marketing-button marketing-button-compact",
                  menuOpen && "marketing-button-on-dark",
                )}
              >
                Join Waitlist
              </button>
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
                  <ForayIcon
                    name="menu"
                    size="small"
                    className={cn(
                      "absolute inset-0 m-auto transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      menuOpen
                        ? "scale-75 rotate-90 opacity-0"
                        : "scale-100 rotate-0 opacity-100",
                    )}
                  />
                  <ForayIcon
                    name="close"
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

          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
              menuOpen
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden">
              <nav
                aria-label="Mobile"
                className="flex flex-col gap-1 px-5 pb-8 pt-2 sm:px-6"
              >
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(link.href);
                      window.history.pushState(null, "", link.href);
                    }}
                    className="rounded-2xl px-3 py-3.5 text-left text-[1.65rem] font-semibold leading-none tracking-tight text-white transition-colors hover:bg-white/10"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
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

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { cn } from "@/lib/cn";
import type { LegalNavSection } from "./legal-section";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasFinePointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function sectionTopY(el: HTMLElement) {
  const current = window.scrollY || document.documentElement.scrollTop;
  return Math.max(0, Math.round(el.getBoundingClientRect().top + current));
}

const MOBILE_IDLE_MS = 3000;

export function LegalSectionNav({
  sections,
}: {
  sections: LegalNavSection[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  /** Mobile only: hide the dash rail after idle; always visible on desktop. */
  const [railVisible, setRailVisible] = useState(true);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleIds = useRef(new Set<string>());
  const lenis = useLenis();

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const syncActive = () => {
      for (const section of sections) {
        if (visibleIds.current.has(section.id)) {
          setActiveId(section.id);
          return;
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visibleIds.current.add(entry.target.id);
          } else {
            visibleIds.current.delete(entry.target.id);
          }
        }
        syncActive();
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0, 0.1, 0.25],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

  // Mobile: show rail while scrolling; hide ~3s after scroll stops (unless panel open).
  useEffect(() => {
    if (hasFinePointer()) {
      setRailVisible(true);
      return;
    }

    const clearIdle = () => {
      if (idleTimer.current) {
        clearTimeout(idleTimer.current);
        idleTimer.current = null;
      }
    };

    const bump = () => {
      if (hasFinePointer()) return;
      setRailVisible(true);
      clearIdle();
      idleTimer.current = setTimeout(() => {
        setOpen((isOpen) => {
          if (!isOpen) setRailVisible(false);
          return isOpen;
        });
      }, MOBILE_IDLE_MS);
    };

    bump();
    window.addEventListener("scroll", bump, { passive: true });
    return () => {
      window.removeEventListener("scroll", bump);
      clearIdle();
    };
  }, []);

  // Keep rail visible while the mobile panel is open.
  useEffect(() => {
    if (hasFinePointer()) return;
    if (open) setRailVisible(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const clearLeaveTimer = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (!hasFinePointer()) return;
    clearLeaveTimer();
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!hasFinePointer()) return;
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => setOpen(false), 160);
  };

  const scrollToSection = useCallback(
    (id: string) => {
      const el = document.getElementById(id);
      if (!el) return;
      const y = sectionTopY(el);
      if (lenis && hasFinePointer() && !prefersReducedMotion()) {
        lenis.scrollTo(y, { offset: 0, duration: 1.15 });
      } else {
        window.scrollTo({
          top: y,
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
      }
      window.history.replaceState(null, "", `#${id}`);
      setActiveId(id);
      if (!hasFinePointer()) setOpen(false);
    },
    [lenis],
  );

  if (sections.length === 0) return null;

  const showChrome = railVisible || open;

  return (
    <div
      ref={rootRef}
      className={cn(
        "pointer-events-none fixed inset-y-0 right-0 z-40 flex items-center pr-1 sm:pr-2",
        "transition-opacity duration-300 motion-reduce:transition-none",
        showChrome ? "opacity-100" : "opacity-0",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "pointer-events-auto relative flex items-center",
          !showChrome && "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute right-full mr-2 origin-right",
            "rounded-2xl border border-border bg-surface/95 shadow-lg backdrop-blur-md",
            // Fine pointer: full list, no internal scroll. Coarse: cap height.
            "w-[min(calc(100vw-3rem),17rem)] px-2 py-2",
            "max-h-[min(92vh,calc(100dvh-1.5rem))] overflow-y-auto",
            "[@media(hover:hover)_and_(pointer:fine)]:max-h-none",
            "[@media(hover:hover)_and_(pointer:fine)]:overflow-visible",
            "transition-[opacity,transform] duration-200 ease-out",
            open
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-2 opacity-0",
            "motion-reduce:transition-none",
          )}
          id="legal-section-nav-panel"
          aria-hidden={!open}
        >
          <ul className="space-y-0.5">
            {sections.map((section) => {
              const isActive = section.id === activeId;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "block rounded-lg px-2 py-1.5 text-sm leading-snug transition-colors",
                      isActive
                        ? "bg-section-grey font-medium text-foreground"
                        : "text-muted hover:bg-section-grey/70 hover:text-foreground",
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(section.id);
                    }}
                  >
                    {section.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <nav
          aria-label="Page sections"
          className="flex flex-col items-center gap-1.5 rounded-full px-2 py-3"
        >
          <button
            type="button"
            className="flex flex-col items-center gap-1.5 rounded-full py-1 outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
            aria-expanded={open}
            aria-controls="legal-section-nav-panel"
            aria-label={open ? "Close section list" : "Open section list"}
            onClick={() => {
              if (hasFinePointer()) return;
              setOpen((v) => !v);
            }}
          >
            {sections.map((section) => {
              const isActive = section.id === activeId;
              return (
                <span
                  key={section.id}
                  aria-hidden
                  className={cn(
                    "block h-0.5 rounded-full transition-all duration-200",
                    isActive
                      ? "w-5 bg-foreground"
                      : "w-2.5 bg-foreground/25",
                  )}
                />
              );
            })}
          </button>
        </nav>
      </div>
    </div>
  );
}

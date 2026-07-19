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

export function LegalSectionNav({
  sections,
}: {
  sections: LegalNavSection[];
}) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
        // Match sticky navbar offset; prefer the section near the top third.
        rootMargin: "-96px 0px -55% 0px",
        threshold: [0, 0.1, 0.25],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sections]);

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

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-y-0 right-0 z-40 flex items-center pr-1 sm:pr-2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="pointer-events-auto relative flex items-center">
        <div
          className={cn(
            "absolute right-full mr-2 origin-right",
            "rounded-2xl border border-border bg-surface/95 shadow-lg backdrop-blur-md",
            "max-h-[min(70vh,28rem)] w-[min(calc(100vw-3rem),16.5rem)] overflow-y-auto",
            "px-3 py-3 transition-[opacity,transform] duration-200 ease-out",
            open
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-2 opacity-0",
            "motion-reduce:transition-none",
          )}
          id="legal-section-nav-panel"
          aria-hidden={!open}
        >
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
            On this page
          </p>
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
          aria-label="On this page"
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

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { useWaitlist } from "./waitlist-provider";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-4" aria-hidden="true">
      <span
        className={cn(
          "absolute left-0 top-[3px] h-[1.5px] w-full rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "top-[6px] rotate-45",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-[13px] h-[1.5px] w-full rounded-full bg-current transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          open && "top-[6px] -rotate-45",
        )}
      />
    </span>
  );
}

export function Navbar() {
  const { open } = useWaitlist();
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <>
      {/* Transparent floating chrome — page content scrolls to the edge underneath. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "pointer-events-auto mx-auto max-w-[1600px] transition-[background-color,border-radius,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            menuOpen
              ? "bg-ink text-white shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:bg-transparent md:text-foreground md:shadow-none"
              : "bg-transparent",
            menuOpen && "rounded-b-[2rem] sm:rounded-b-[2.5rem] md:rounded-none",
          )}
        >
          <div className="flex items-center justify-between px-5 py-3 sm:px-6 md:px-10 md:py-4">
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
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={open}
                className="ml-1 cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                Join Waitlist
              </button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={open}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  menuOpen
                    ? "bg-white text-ink hover:bg-white/90"
                    : "bg-foreground text-background hover:bg-foreground/90",
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
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300",
                  menuOpen
                    ? "bg-white text-ink"
                    : "border border-black/10 bg-white text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
                )}
              >
                <MenuToggleIcon open={menuOpen} />
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
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-2xl px-3 py-3.5 text-left text-[1.65rem] font-semibold leading-none tracking-tight text-white transition-colors hover:bg-white/10"
                  >
                    {link.label}
                  </Link>
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

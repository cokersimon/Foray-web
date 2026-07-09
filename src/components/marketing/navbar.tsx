"use client";

import { useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { ForayIcon } from "@/components/brand/foray-icon";
import { useWaitlist } from "./waitlist-provider";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  const { open } = useWaitlist();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4 md:px-8">
      <nav className="pointer-events-auto mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-3 rounded-full border border-border-glass bg-glass-heavy/80 px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-2xl backdrop-saturate-150 sm:px-4 sm:py-2.5">
          <Link
            href="/"
            className="shrink-0 rounded-sm px-1 transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
            onClick={() => setMenuOpen(false)}
          >
            <Wordmark className="text-xl tracking-tighter sm:text-2xl" />
          </Link>

          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={open}
              className="ml-1 cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              Join Waitlist
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={open}
              className="cursor-pointer rounded-full bg-foreground px-3.5 py-1.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Join Waitlist
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="rounded-full border border-border/80 bg-white/50 p-2 text-foreground"
            >
              <ForayIcon name={menuOpen ? "close" : "menu"} size="small" />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mt-2 overflow-hidden rounded-[28px] border border-border-glass bg-glass-heavy/90 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl md:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}

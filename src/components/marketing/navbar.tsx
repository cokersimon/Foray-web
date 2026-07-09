"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";
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
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-[24px]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-3 sm:px-6 md:px-10 md:py-4">
        <Link
          href="/"
          className="shrink-0 rounded-sm transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-dot"
          onClick={() => setMenuOpen(false)}
        >
          <Wordmark className="text-2xl tracking-tighter" />
        </Link>

        {/* Desktop: links + CTA in a frosted pill */}
        <div className="hidden items-center gap-0.5 rounded-full border border-border-glass bg-glass p-1 shadow-[0_4px_24px_rgba(0,0,0,0.05)] backdrop-blur-[20px] md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand-dot"
            >
              {link.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={open}
            className="cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-dot"
          >
            Join Waitlist
          </button>
        </div>

        {/* Mobile: real CTA button + menu toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={open}
            className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
          >
            Join Waitlist
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="rounded-full border border-border bg-surface p-2 text-foreground"
          >
            {menuOpen ? (
              <X className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Menu className="h-4 w-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t border-border px-6 py-3 md:hidden">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-3 text-base font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

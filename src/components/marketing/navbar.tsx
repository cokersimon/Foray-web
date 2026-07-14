"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/brand/wordmark";
import { SfSymbol } from "@/components/brand/sf-symbol";
import { trackDownloadApp, trackNavClick } from "@/lib/analytics";
import { APP_STORE_URL } from "@/lib/site";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Pricing", href: "/#pricing" },
  { label: "FAQ", href: "/#faq" },
  { label: "About", href: "/#about" },
];

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
  const pathname = usePathname();
  const router = useRouter();

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

  function scrollToSectionTop(el: HTMLElement) {
    document.body.style.overflow = "";
    setMenuOpen(false);
    window.scrollTo({
      top: sectionTopY(el),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  // Land on /#pricing (etc.) after a full load or a client nav from Privacy/Terms.
  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;

    let cancelled = false;
    let attempts = 0;
    const run = () => {
      if (cancelled) return;
      const el = document.getElementById(hash);
      if (el) {
        scrollToSectionTop(el);
        return;
      }
      if (attempts++ < 40) {
        window.setTimeout(run, 50);
      }
    };
    const id = window.setTimeout(run, 80);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [pathname]);

  function onNavLinkClick(
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    const id = href.includes("#") ? href.split("#")[1] : null;
    if (!id) return;
    trackNavClick(id);
    e.preventDefault();

    const el = document.getElementById(id);
    if (el) {
      scrollToSectionTop(el);
      window.history.pushState(null, "", href);
      return;
    }

    // Privacy/Terms (etc.): App Router can drop the hash on client nav, so go
    // home first, restore the hash, then scroll once the section mounts.
    setMenuOpen(false);
    document.body.style.overflow = "";
    router.push("/");
    const started = performance.now();
    const poll = () => {
      const target = document.getElementById(id);
      if (target) {
        window.history.replaceState(null, "", href);
        scrollToSectionTop(target);
        return;
      }
      if (performance.now() - started < 3000) {
        window.requestAnimationFrame(poll);
      }
    };
    window.requestAnimationFrame(poll);
  }

  return (
    <>
      <header className="relative z-50 bg-ink text-white">
        <div
          className={cn(
            "mx-auto max-w-[1600px] transition-[border-radius,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            menuOpen &&
              "rounded-b-[2rem] shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:rounded-b-[2.5rem] md:rounded-none md:shadow-none",
          )}
        >
          <div
            data-site-header-bar
            className="flex items-center justify-between px-5 py-3 sm:px-6 md:px-10 md:py-4"
          >
            <Link
              href="/"
              className="shrink-0 rounded-sm text-white transition-opacity hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              onClick={() => setMenuOpen(false)}
            >
              <Wordmark className="text-2xl text-white" />
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => onNavLinkClick(e, link.href)}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                >
                  {link.label}
                </a>
              ))}
              <a
                href={APP_STORE_URL}
                onClick={() => trackDownloadApp("nav")}
                className="marketing-button marketing-button-compact marketing-button-on-dark ml-1"
              >
                Get Foray
              </a>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <a
                href={APP_STORE_URL}
                onClick={() => trackDownloadApp("nav")}
                className="marketing-button marketing-button-compact marketing-button-on-dark"
              >
                Download
              </a>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                className="glass-chip glass-chip-on-dark relative flex h-10 w-10 items-center justify-center"
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

          <div
            className={cn(
              "overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden",
              menuOpen
                ? "max-h-[32rem] opacity-100"
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
                  onClick={(e) => onNavLinkClick(e, link.href)}
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

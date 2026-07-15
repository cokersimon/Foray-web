"use client";

import Link from "next/link";
import { LEGAL_ENTITY, registeredOfficeBlock } from "@/lib/legal-entity";
import { trackFooterClick, trackSocialClick } from "@/lib/analytics";
import { SOCIAL_LINKS } from "@/lib/site";

const FOOTER_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: `mailto:${LEGAL_ENTITY.supportEmail}` },
];

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M19.32 5.56a5.12 5.12 0 0 1-3.01-2.6 5.09 5.09 0 0 1-.44-1.46h-3.14v12.8a2.68 2.68 0 1 1-2.68-2.68c.28 0 .54.04.8.12V8.5a5.88 5.88 0 0 0-.8-.06 5.9 5.9 0 1 0 5.9 5.9V9.02a8.24 8.24 0 0 0 4.4 1.27V7.15c-.36 0-.71-.04-1.05-.1a5.1 5.1 0 0 1-.98-.3 5.13 5.13 0 0 1 1-1.19Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M18.9 2.5h3.4l-7.4 8.4 8.7 11.6h-6.8l-5.3-7-6.1 7H1.9l7.9-9L1.4 2.5h7l4.8 6.4 5.7-6.4Zm-1.2 18h1.9L7.4 4.4H5.4l12.3 16.1Z" />
    </svg>
  );
}

const SOCIALS = [
  {
    label: "Instagram",
    href: SOCIAL_LINKS.instagram,
    icon: <InstagramIcon className="h-5 w-5" />,
  },
  {
    label: "TikTok",
    href: SOCIAL_LINKS.tiktok,
    icon: <TikTokIcon className="h-5 w-5" />,
  },
  {
    label: "X",
    href: SOCIAL_LINKS.x,
    icon: <XIcon className="h-4.5 w-4.5" />,
  },
];

export function Footer() {
  const officeLines = registeredOfficeBlock();

  return (
    <footer className="overflow-hidden bg-ink text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 pt-14 md:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Foray on ${social.label}`}
                className="-m-2 p-2 text-white/55 transition-colors hover:text-white"
                onClick={() => trackSocialClick(social.label)}
              >
                {social.icon}
              </a>
            ))}
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) =>
              link.href.startsWith("/") ? (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/55 transition-colors hover:text-white"
                  onClick={() => trackFooterClick(link.label)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/55 transition-colors hover:text-white"
                  onClick={() => trackFooterClick(link.label)}
                >
                  {link.label}
                </a>
              ),
            )}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <address className="not-italic text-xs leading-relaxed text-white/45">
            <span className="font-medium text-white/80">
              {LEGAL_ENTITY.legalName}
            </span>
            <br />
            Company number {LEGAL_ENTITY.companyNumber}
            {officeLines.map((line) => (
              <span key={line}>
                <br />
                {line}
              </span>
            ))}
          </address>

          <span className="text-xs text-white/40 sm:text-right">
            &copy; {new Date().getFullYear()} Foray. All rights reserved.
          </span>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="font-wordmark pointer-events-none -mb-[0.28em] mt-8 select-none text-center leading-none text-white/[0.12]"
        style={{ fontSize: "clamp(5rem, 22vw, 22rem)" }}
      >
        Foray<span className="font-wordmark-dot text-brand-dot">.</span>
      </div>
    </footer>
  );
}

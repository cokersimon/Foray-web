import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

const footerLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <Wordmark className="text-sm" />
        <div className="flex gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <span className="text-xs text-muted">
          &copy; {new Date().getFullYear()} Foray. All rights reserved.
        </span>
      </div>
    </footer>
  );
}

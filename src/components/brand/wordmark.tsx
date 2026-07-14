import { cn } from "@/lib/cn";

/**
 * Foray wordmark — Caveat 700 script letterforms with a trailing period in the
 * brand orange dot (ADR-013 / branding-logo.md). `abbreviated` renders the
 * boot/app-icon "F." mark.
 */
export function Wordmark({
  abbreviated = false,
  className,
}: {
  abbreviated?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("font-wordmark leading-none text-foreground", className)}>
      {abbreviated ? "F" : "Foray"}
      <span className="font-wordmark-dot text-brand-dot">.</span>
    </span>
  );
}

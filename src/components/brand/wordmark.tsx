import { cn } from "@/lib/cn";

/**
 * Foray wordmark — Caveat 700 script letterforms with a trailing period in the
 * brand orange dot (ADR-013 / branding-logo.md). `abbreviated` renders the
 * boot/app-icon "F." mark. Optional `suffix` (e.g. "Admin") stays in Caveat after
 * the orange period — used by the admin portal as Foray.Admin.
 */
export function Wordmark({
  abbreviated = false,
  suffix,
  className,
}: {
  abbreviated?: boolean;
  /** Rendered after the orange period in the same Caveat wordmark (e.g. "Admin"). */
  suffix?: string;
  className?: string;
}) {
  return (
    <span className={cn("font-wordmark leading-none text-foreground", className)}>
      {abbreviated ? "F" : "Foray"}
      <span className="font-wordmark-dot text-brand-dot">.</span>
      {suffix}
    </span>
  );
}

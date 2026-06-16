import { cn } from "@/lib/cn";

/**
 * Foray wordmark — "Foray" in the primary label colour with a full stop in the
 * brand orange dot (systemOrange), the mark's sole flourish (ADR-013 / branding-logo.md).
 * `abbreviated` renders the boot/app-icon "F." mark.
 */
export function Wordmark({
  abbreviated = false,
  className,
}: {
  abbreviated?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-bold leading-none tracking-tight text-foreground",
        className,
      )}
    >
      {abbreviated ? "F" : "Foray"}
      <span className="text-brand-dot">.</span>
    </span>
  );
}

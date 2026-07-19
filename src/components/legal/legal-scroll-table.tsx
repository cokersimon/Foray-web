import { cn } from "@/lib/cn";

/**
 * Horizontally scrollable table shell for legal pages when the viewport is
 * narrower than the table (especially mobile).
 */
export function LegalScrollTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto overscroll-x-contain rounded-2xl border border-border",
        "[-webkit-overflow-scrolling:touch]",
        className,
      )}
    >
      <div className="inline-block min-w-full align-middle">{children}</div>
    </div>
  );
}

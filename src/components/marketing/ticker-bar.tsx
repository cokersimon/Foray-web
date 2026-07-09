const TICKER_ITEMS = [
  "Launching soon in the UK",
  "Early access now open",
  "The recipes you save, finally for dinner",
];

/**
 * Calm pre-launch announcement. Pure CSS animation; reduced-motion users get a
 * single static line instead.
 */
export function TickerBar() {
  // Each half is repeated enough to span any viewport; the pair loops at -50%.
  const half = Array.from({ length: 4 }, () => TICKER_ITEMS).flat();

  return (
    <div className="relative z-50 overflow-hidden border-b border-border bg-surface py-2 text-[11px] font-medium tracking-wide text-muted">
      {/* Marquee (animated) */}
      <div className="hidden w-max motion-safe:flex motion-safe:animate-marquee">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0 items-center"
          >
            {half.map((item, i) => (
              <span key={`${copy}-${i}`} className="flex items-center">
                <span className="whitespace-nowrap px-4">{item}</span>
                <span aria-hidden="true" className="text-brand-dot">
                  •
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Static fallback for prefers-reduced-motion */}
      <p className="hidden text-center motion-reduce:block">
        Launching soon in the UK · Early access now open
      </p>
    </div>
  );
}

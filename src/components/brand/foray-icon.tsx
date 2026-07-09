import { cn } from "@/lib/cn";

/**
 * Minimal SF-inspired web glyphs for marketing chrome.
 * Semantic names map to iOS meanings without embedding licensed SF Symbols.
 */
export type ForayIconName =
  | "arrowRight"
  | "arrowLeft"
  | "chevronDown"
  | "check"
  | "checkBadge"
  | "menu"
  | "close"
  | "cart"
  | "heart"
  | "clock";

const SIZE = {
  caption: 12,
  small: 17,
  row: 20,
  action: 22,
  feature: 34,
} as const;

export type ForayIconSize = keyof typeof SIZE;

export function ForayIcon({
  name,
  size = "row",
  className,
  filled = false,
}: {
  name: ForayIconName;
  size?: ForayIconSize | number;
  className?: string;
  filled?: boolean;
}) {
  const px = typeof size === "number" ? size : SIZE[size];
  const common = {
    width: px,
    height: px,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
    className: cn("shrink-0", className),
  };

  switch (name) {
    case "arrowRight":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case "arrowLeft":
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m11 6-6 6 6 6" />
        </svg>
      );
    case "chevronDown":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          {filled ? (
            <>
              <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />
              <path d="m8.5 12.2 2.2 2.2 4.8-5" stroke="var(--background, #fff)" />
            </>
          ) : (
            <path d="m5.5 12.5 4 4 9-9" />
          )}
        </svg>
      );
    case "checkBadge":
      return (
        <svg {...common}>
          <path d="M12 3.2 14.2 5l2.6.3.9 2.5 2.2 1.5-1 2.4.4 2.6-2.2 1.4-.9 2.5-2.6.4L12 20.8l-2.2-1.8-2.6-.4-.9-2.5-2.2-1.4.4-2.6-1-2.4 2.2-1.5.9-2.5 2.6-.3L12 3.2Z" />
          <path d="m8.8 12.1 2.1 2.1 4.3-4.4" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );
    case "cart":
      return (
        <svg {...common}>
          <path d="M3.5 5.5h1.8l1.4 10.2a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.3L19.5 8H7" />
          <circle cx="9.5" cy="19.2" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="16.2" cy="19.2" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} fill={filled ? "currentColor" : "none"}>
          <path d="M12 20s-6.8-4.2-8.8-8.1C1.6 8.6 3.2 5.5 6.4 5.2c1.8-.2 3.4.8 4.1 2.2.7-1.4 2.3-2.4 4.1-2.2 3.2.3 4.8 3.4 3.2 6.7C18.8 15.8 12 20 12 20Z" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 8.2V12l2.6 1.8" />
        </svg>
      );
  }
}

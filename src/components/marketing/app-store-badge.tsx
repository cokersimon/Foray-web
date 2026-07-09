import Image from "next/image";
import { APP_STORE_URL } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * Official Apple "Download on the App Store" badge.
 * Artwork from Apple Media Services; do not recolour, rotate, or restyle.
 */
export function AppStoreBadge({
  className,
  size = "default",
}: {
  className?: string;
  size?: "compact" | "default";
}) {
  // Toolbar stays compact; hero/pricing use a larger badge for clearer CTA.
  const height = size === "compact" ? 32 : 60;
  const width = Math.round(height * (119.66407 / 40));

  return (
    <a
      href={APP_STORE_URL}
      className={cn(
        "inline-flex shrink-0 transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground",
        className,
      )}
      aria-label="Download on the App Store"
    >
      <Image
        src="/brand/app-store-badge.svg"
        alt="Download on the App Store"
        width={width}
        height={height}
        className="h-auto w-auto"
        unoptimized
        priority={size === "default"}
      />
    </a>
  );
}

"use client";

import Image from "next/image";
import { APP_STORE_URL } from "@/lib/site";
import { trackDownloadApp } from "@/lib/analytics";
import { cn } from "@/lib/cn";

/**
 * Official Apple "Download on the App Store" badge.
 * Artwork from Apple Media Services; do not recolour, rotate, or restyle.
 * Use the white variant on dark surfaces (open mobile menu).
 */
export function AppStoreBadge({
  className,
  size = "default",
  variant = "black",
  location = "unknown",
}: {
  className?: string;
  size?: "compact" | "default";
  variant?: "black" | "white";
  /** GA4 `download_app` location param (hero, nav, pricing, referral, …). */
  location?: string;
}) {
  // Compact matches the nav close chip (h-10). Hero/pricing stay larger.
  const isCompact = size === "compact";
  const height = isCompact ? 40 : 60;
  const width = Math.round(height * (119.66407 / 40));
  const src =
    variant === "white"
      ? "/brand/app-store-badge-white.svg"
      : "/brand/app-store-badge.svg";

  return (
    <a
      href={APP_STORE_URL}
      onClick={() => trackDownloadApp(location)}
      className={cn(
        // Artwork stays official; only opacity + focus match other CTAs.
        // Do not wrap in glass/marketing-button (Apple forbids restyling the badge).
        "inline-flex shrink-0 items-center rounded-sm transition-opacity duration-160 hover:opacity-90 active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current",
        className,
      )}
      aria-label="Download on the App Store"
    >
      <Image
        src={src}
        alt="Download on the App Store"
        width={width}
        height={height}
        className={cn("w-auto", isCompact ? "h-10" : "h-[60px] sm:h-16")}
        unoptimized
        priority={!isCompact}
      />
    </a>
  );
}

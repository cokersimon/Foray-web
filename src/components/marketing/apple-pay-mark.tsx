import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Black Apple Pay mark for use on light / brand-coloured surfaces.
 * Do not recolour, animate, or place in the same tile as the App Store badge.
 * @see https://developer.apple.com/apple-pay/marketing/
 */
export function ApplePayMark({
  className,
  height = 36,
}: {
  className?: string;
  height?: number;
}) {
  // Source art is 317×153.
  const width = Math.round(height * (317 / 153));

  return (
    <Image
      src="/brand/apple-pay-mark-black.png"
      alt="Apple Pay"
      width={width}
      height={height}
      className={cn("h-9 w-auto shrink-0 sm:h-10", className)}
      unoptimized
    />
  );
}

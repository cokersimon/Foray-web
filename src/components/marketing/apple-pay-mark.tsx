import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Apple Pay marketing mark (white fill + outline rule).
 * Artwork derived from Apple’s published Apple Pay wordmark; do not recolour,
 * restyle, animate, or combine in the same tile as the App Store badge.
 * @see https://developer.apple.com/apple-pay/marketing/
 */
export function ApplePayMark({
  className,
  height = 36,
}: {
  className?: string;
  /** Display height in CSS pixels. Aspect locked to the mark artwork. */
  height?: number;
}) {
  // Source art is 317×153.
  const width = Math.round(height * (317 / 153));

  return (
    <Image
      src="/brand/apple-pay-mark.png"
      alt="Apple Pay"
      width={width}
      height={height}
      className={cn("h-9 w-auto sm:h-10", className)}
      unoptimized
    />
  );
}

"use client";

import { useSyncExternalStore } from "react";
import { ReactLenis } from "lenis/react";

const COARSE_POINTER = "(hover: none), (pointer: coarse)";

function subscribeToPointer(callback: () => void) {
  const media = window.matchMedia(COARSE_POINTER);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getCoarsePointer() {
  return window.matchMedia(COARSE_POINTER).matches;
}

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasCoarsePointer = useSyncExternalStore(
    subscribeToPointer,
    getCoarsePointer,
    () => false,
  );

  if (hasCoarsePointer) return children;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        // Nav clicks compute a numeric Y themselves. Keep anchors for raw
        // hash changes, with no extra offset (CSS scroll-padding handles those).
        anchors: {
          offset: 0,
          duration: 1.15,
        },
      }}
    >
      {children}
    </ReactLenis>
  );
}

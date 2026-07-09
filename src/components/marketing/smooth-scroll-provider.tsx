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
        // Let Lenis drive #anchor jumps so smooth scroll doesn't fight them.
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}

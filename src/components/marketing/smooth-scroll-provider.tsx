"use client";

import { ReactLenis } from "lenis/react";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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

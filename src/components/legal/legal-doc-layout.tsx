"use client";

import type { LegalNavSection } from "./legal-section";
import { LegalSectionNav } from "./legal-section-nav";

/**
 * Shared chrome for long legal pages: page content + Mealia-style
 * right-edge section index (scroll-spy dashes + hover/tap panel).
 */
export function LegalDocLayout({
  sections,
  children,
}: {
  sections: LegalNavSection[];
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <LegalSectionNav sections={sections} />
    </>
  );
}

import { existsSync } from "node:fs";
import { join } from "node:path";
import { Hero } from "@/components/marketing/hero";
import { BigStatement } from "@/components/marketing/big-statement";
import {
  ScrollytellingSection,
  type ScreenshotMap,
} from "@/components/marketing/scrollytelling-section";
import { ValueProps } from "@/components/marketing/value-props";
import { FiveClicks } from "@/components/marketing/five-clicks";
import { Testimonials } from "@/components/marketing/testimonials";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { SHOW_TESTIMONIALS } from "@/lib/site";

const SCREENSHOT_IDS = ["import", "plan", "cart", "checkout"] as const;

/** Real Simulator captures (public/screenshots/README.md) win over the coded
 * phone mockups the moment the files exist — checked at render/build time. */
function availableScreenshots(): ScreenshotMap {
  const map: ScreenshotMap = {};
  for (const id of SCREENSHOT_IDS) {
    const file = join(process.cwd(), "public", "screenshots", `${id}.png`);
    map[id] = existsSync(file) ? `/screenshots/${id}.png` : null;
  }
  return map;
}

export default function Home() {
  return (
    <>
      <Hero />
      <BigStatement />
      <ScrollytellingSection screenshots={availableScreenshots()} />
      <ValueProps />
      <FiveClicks />
      {SHOW_TESTIMONIALS && <Testimonials />}
      <Pricing />
      <Faq />
      <ClosingCta />
    </>
  );
}

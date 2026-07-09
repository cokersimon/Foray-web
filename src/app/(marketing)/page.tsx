import { Hero } from "@/components/marketing/hero";
import { ScrollytellingSection } from "@/components/marketing/scrollytelling-section";
import { ValueProps } from "@/components/marketing/value-props";
import { FiveClicks } from "@/components/marketing/five-clicks";
import { Testimonials } from "@/components/marketing/testimonials";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { ClosingCta } from "@/components/marketing/closing-cta";
import { SHOW_TESTIMONIALS } from "@/lib/site";

export default function Home() {
  return (
    <>
      <Hero />
      <ScrollytellingSection />
      <ValueProps />
      <FiveClicks />
      {SHOW_TESTIMONIALS && <Testimonials />}
      <Pricing />
      <Faq />
      <ClosingCta />
    </>
  );
}

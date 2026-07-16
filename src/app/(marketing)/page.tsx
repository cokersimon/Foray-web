import { Hero } from "@/components/marketing/hero";
import { ScrollytellingSection } from "@/components/marketing/scrollytelling-section";
import { ValueProps } from "@/components/marketing/value-props";
import { Testimonials } from "@/components/marketing/testimonials";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { About } from "@/components/marketing/about";
import { fetchStorePricing, formatPricing } from "@/lib/pricing";
import { SHOW_TESTIMONIALS } from "@/lib/site";

export default async function Home() {
  const pricing = formatPricing(await fetchStorePricing());
  return (
    <>
      <Hero />
      <ScrollytellingSection />
      <ValueProps />
      {SHOW_TESTIMONIALS && <Testimonials />}
      <Pricing pricing={pricing} />
      <Faq />
      <About />
    </>
  );
}

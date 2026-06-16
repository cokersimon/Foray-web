import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { ScrollytellingSection } from "@/components/marketing/scrollytelling-section";
import { Promise } from "@/components/marketing/promise";
import { Pricing } from "@/components/marketing/pricing";
import { Footer } from "@/components/marketing/footer";
import { WaitlistProvider } from "@/components/marketing/waitlist-provider";
import { WaitlistModal } from "@/components/marketing/waitlist-modal";
import { SmoothScrollProvider } from "@/components/marketing/smooth-scroll-provider";

export default function Home() {
  return (
    <WaitlistProvider>
      <SmoothScrollProvider>
        <Navbar />
        <Hero />
        <WaitlistModal />
        <ScrollytellingSection />
        <Promise />
        <Pricing />
        <Footer />
      </SmoothScrollProvider>
    </WaitlistProvider>
  );
}

import { Navbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { ScrollytellingSection } from "@/components/marketing/scrollytelling-section";
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
        <Footer />
      </SmoothScrollProvider>
    </WaitlistProvider>
  );
}

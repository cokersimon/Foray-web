import { CookieBanner } from "@/components/marketing/cookie-banner";

/**
 * Share landings live outside the marketing shell (no nav/footer) but still
 * need consent-gated GA so App Store CTA clicks can be attributed.
 */
export default function ShareLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}

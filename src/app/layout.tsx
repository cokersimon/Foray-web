import type { Metadata, Viewport } from "next";
import { Caveat, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

/** Non-Apple stand-in for SF Pro (globals.css --font-sans). Zero cost on Apple
 * devices, where -apple-system still wins the stack. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/** Wordmark script (Caveat 700) — Google Fonts via next/font. */
const caveat = Caveat({
  weight: "700",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Foray: Swipe, Shop, Cook",
  description:
    "Bring the recipes you love into one calm place. Foray helps you choose dinner, builds a deduped grocery list and guides you through cooking.",
  openGraph: {
    title: "Foray: Swipe, Shop, Cook",
    description:
      "Swipe through recipes, tap to add, and your trolley builds itself. Shop and cook in one calm place.",
    url: SITE_URL,
    siteName: "Foray",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foray: Swipe, Shop, Cook",
    description:
      "Swipe through recipes, tap to add, and your trolley builds itself. Shop and cook in one calm place.",
  },
};

/** Explicit viewport so iPad (and all tablets) get correct scale + safe-area. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`h-full antialiased ${inter.variable} ${caveat.variable}`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

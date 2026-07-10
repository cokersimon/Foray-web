import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Foray: Swipe, Shop, Cook",
  description:
    "Bring the recipes you love into one calm place. Foray helps you choose dinner, builds a deduped grocery list and guides you through cooking.",
  openGraph: {
    title: "Foray: Swipe, Shop, Cook",
    description:
      "The recipes you save, finally for dinner. Choose, shop and cook in one calm place.",
    url: SITE_URL,
    siteName: "Foray",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foray: Swipe, Shop, Cook",
    description:
      "The recipes you save, finally for dinner. Choose, shop and cook in one calm place.",
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
    <html lang="en-GB" className={`h-full antialiased ${inter.variable}`}>
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

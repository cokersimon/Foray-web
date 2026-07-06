import type { Metadata } from "next";
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
  title: "Foray — Swipe to fork",
  description:
    "Foray turns recipes you love into a sorted grocery list and a five-click checkout. Built for busy, ADHD-friendly UK kitchens.",
  openGraph: {
    title: "Foray — Swipe to fork",
    description:
      "Recipes in. Groceries out. Foray turns recipes you love into a sorted grocery trolley and a five-click checkout.",
    url: SITE_URL,
    siteName: "Foray",
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Foray — Swipe to fork",
    description:
      "Recipes in. Groceries out. Foray turns recipes you love into a sorted grocery trolley and a five-click checkout.",
  },
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

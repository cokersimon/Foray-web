import { sendGAEvent } from "@next/third-parties/google";
import { getConsentSnapshot } from "@/lib/consent";

/**
 * Fire a GA4 custom event. No-ops when the measurement ID is unset, consent
 * is not granted, or the GA dataLayer is not ready yet (avoids noisy
 * @next/third-parties warnings before the cookie banner Accept path mounts GA).
 */
function trackEvent(
  name: string,
  params?: Record<string, string>,
): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) return;
  if (getConsentSnapshot() !== "granted") return;
  if (!Array.isArray(window.dataLayer)) return;

  sendGAEvent("event", name, params ?? {});
}

export function trackDownloadApp(location: string): void {
  trackEvent("download_app", { location });
}

export function trackFaqOpen(question: string): void {
  trackEvent("faq_open", { question });
}

export function trackFooterClick(label: string): void {
  trackEvent("footer_click", { label });
}

export function trackSocialClick(network: string): void {
  trackEvent("social_click", { network });
}

export function trackNavClick(target: string): void {
  trackEvent("nav_click", { target });
}

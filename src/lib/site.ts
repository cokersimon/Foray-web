/** Shared site-wide constants for the Foray marketing pages. */

/**
 * App Store listing. Foray is pre-launch, so this is a placeholder — swap in the
 * real `id##########` link once the app is live. `APP_STORE_LIVE` gates whether
 * marketing shows a real download button or the "coming soon" / waitlist CTA.
 */
export const APP_STORE_URL = "https://apps.apple.com/gb/app/foray/id000000000";
export const APP_STORE_LIVE = false;

/** Public marketing domain. */
export const SITE_URL = "https://forayapp.co.uk";

/** Convenience fee charged at online checkout (GBP), surfaced in pricing copy. */
export const CHECKOUT_FEE_GBP = "2.49";

/**
 * Social-proof sections (same gate pattern as APP_STORE_LIVE). Placeholder
 * quotes on a public pre-launch site read as fabricated social proof, so these
 * stay false until at least two real TestFlight quotes exist — then flip.
 */
export const SHOW_TESTIMONIALS = false;
export const SHOW_PRESS = false;

/** Social accounts (mirrors the iOS app's AboutView). */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/foray_app",
  tiktok: "https://www.tiktok.com/@forayapp",
  x: "https://x.com/forayapp",
} as const;

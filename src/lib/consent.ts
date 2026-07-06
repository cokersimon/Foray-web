/**
 * Cookie-consent storage (ICO/PECR "basic" posture: nothing non-essential
 * loads until the user accepts). The consent record itself — localStorage plus
 * a 6-month cookie — is strictly-necessary and exempt.
 */

export type ConsentValue = "granted" | "denied";
/** "unset": no decision yet (show banner). "pending": server render / before
 * storage is readable (render nothing to avoid a hydration flash). */
export type ConsentState = ConsentValue | "unset" | "pending";

export const CONSENT_KEY = "foray-consent";
const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 182; // ~6 months

const listeners = new Set<() => void>();

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConsentSnapshot(): ConsentState {
  const value = window.localStorage.getItem(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : "unset";
}

export function getConsentServerSnapshot(): ConsentState {
  return "pending";
}

export function storeConsent(value: ConsentValue): void {
  window.localStorage.setItem(CONSENT_KEY, value);
  document.cookie = `${CONSENT_KEY}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
  listeners.forEach((listener) => listener());
}

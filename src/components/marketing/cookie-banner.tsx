"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  getConsentServerSnapshot,
  getConsentSnapshot,
  storeConsent,
  subscribeConsent,
  type ConsentValue,
} from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * GDPR cookie banner + consent-gated analytics in one place. GA4 only mounts
 * after Accept and only when NEXT_PUBLIC_GA_MEASUREMENT_ID exists — inert
 * until the property is created. Rendered by the marketing shell only, never
 * over /admin.
 */
export function CookieBanner() {
  // "pending" during SSR/hydration (renders nothing — no flash); storage is
  // the source of truth after that.
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );

  function decide(value: ConsentValue) {
    storeConsent(value);
  }

  return (
    <>
      {consent === "granted" && GA_ID && <GoogleAnalytics gaId={GA_ID} />}

      {consent === "unset" && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-[90] p-4 md:p-6"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-[0_8px_40px_rgba(0,0,0,0.12)] md:flex-row md:items-center md:gap-6 md:p-6">
            <p className="flex-1 text-xs leading-relaxed text-muted md:text-sm">
              We use one optional analytics cookie to understand how people
              find Foray. Nothing loads unless you accept. See our{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => decide("denied")}
                className="cursor-pointer rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/[0.04]"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => decide("granted")}
                className="cursor-pointer rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

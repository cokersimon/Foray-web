"use client";

import { ForayIcon } from "@/components/brand/foray-icon";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";

export function ClosingCta() {
  const { open } = useWaitlist();

  return (
    <section className="bg-background px-5 pb-16 pt-6 sm:px-6 md:pb-24 lg:px-10 lg:pb-28">
      <div className="relative mx-auto flex max-w-7xl flex-col items-center overflow-hidden rounded-[36px] bg-brand-dot px-6 py-20 text-center text-black md:py-24">
        <p className="relative text-[13px] font-semibold tracking-[-0.01em] text-black/55">
          Launching soon in the UK
        </p>
        <h2 className="relative mt-4 max-w-4xl text-balance text-[clamp(2.4rem,5.5vw,4.75rem)] font-bold leading-[1.02] tracking-[-0.045em]">
          Make tonight’s dinner the easy one.
        </h2>
        <p className="relative mt-5 max-w-xl text-pretty text-base leading-relaxed text-black/65 md:text-lg">
          Join the waitlist for early access to Foray on iPhone.
        </p>
        <div className="relative mt-8">
          {APP_STORE_LIVE ? (
            <a href={APP_STORE_URL} className="marketing-button">
              Download on the App Store{" "}
              <ForayIcon name="arrowRight" size="small" />
            </a>
          ) : (
            <button type="button" onClick={open} className="marketing-button">
              Join the waitlist <ForayIcon name="arrowRight" size="small" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

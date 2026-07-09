"use client";

import Image from "next/image";
import { ForayIcon } from "@/components/brand/foray-icon";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";
import { ProductPhone } from "./product-phone";

export function Hero() {
  const { open } = useWaitlist();

  return (
    <section className="relative overflow-hidden bg-background px-5 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-10 md:pb-28 md:pt-14 lg:px-10 lg:pb-32 lg:pt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-8 sm:gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
        <div className="relative z-10 text-center lg:text-left">
          <h1
            className="motion-safe:animate-rise text-balance text-[clamp(2.6rem,7.2vw,5.75rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground"
            style={{ animationDelay: "0s" }}
          >
            The recipes you save.
            <br className="hidden sm:block" /> Finally{" "}
            <span className="whitespace-nowrap">
              for dinner<span className="text-brand-dot">.</span>
            </span>
          </h1>
          <p
            className="motion-safe:animate-rise mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted sm:mt-6 sm:text-lg lg:mx-0"
            style={{ animationDelay: "0.16s" }}
          >
            Pick a recipe, build one tidy grocery list and get cooking, all in
            one place.
          </p>

          <div
            className="motion-safe:animate-rise mt-7 flex flex-col items-center gap-3 sm:mt-8"
            style={{ animationDelay: "0.24s" }}
          >
            {APP_STORE_LIVE ? (
              <a href={APP_STORE_URL} className="marketing-button">
                Download on the App Store <ForayIcon name="arrowRight" size="small" />
              </a>
            ) : (
              <button type="button" onClick={open} className="marketing-button">
                Join the waitlist <ForayIcon name="arrowRight" size="small" />
              </button>
            )}
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Launching soon
            </p>
          </div>
        </div>

        <div
          className="motion-safe:animate-rise relative mx-auto min-h-[370px] w-full max-w-[380px] sm:min-h-[560px] sm:max-w-[620px] lg:min-h-[600px]"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="absolute inset-x-[2%] top-[2%] h-[86%] overflow-hidden rounded-[36px] bg-[#f5f5f7] sm:top-[3%] sm:h-[78%] sm:rounded-[48px]">
            <Image
              src="/brand/foray-uk-groceries.png"
              alt=""
              aria-hidden="true"
              fill
              priority
              sizes="(max-width: 1024px) 92vw, 620px"
              className="object-cover opacity-95"
            />
          </div>
          <div className="absolute inset-x-0 bottom-0 top-[8%] flex items-center justify-center">
            <ProductPhone
              screen="recipes"
              className="w-[168px] sm:w-[250px] lg:w-[270px]"
            />
          </div>
          <div className="absolute left-[1%] top-[15%] -rotate-6 rounded-2xl border border-white/10 bg-ink px-3 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.22)] sm:left-[-2%] sm:top-[22%] sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold text-white/55">Saved from TikTok</p>
            <p className="mt-0.5 text-xs font-bold text-white sm:text-sm">Ready to cook</p>
          </div>
          <div className="absolute right-[1%] top-[12%] rotate-6 rounded-2xl border border-white/10 bg-ink px-3 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.22)] sm:right-[-2%] sm:top-[18%] sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold text-white/55">Swipe to fork</p>
            <p className="mt-0.5 text-xs font-bold text-white sm:text-sm">One easy pick</p>
          </div>
          <div className="absolute bottom-[18%] left-[1%] rotate-[-4deg] rounded-2xl border border-white/10 bg-ink px-3 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.22)] sm:bottom-[22%] sm:left-[-3%] sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold text-white/55">Cook mode</p>
            <p className="mt-0.5 text-xs font-bold text-white sm:text-sm">Timers beside the hob</p>
          </div>
          <div className="absolute bottom-[7%] right-[1%] rotate-3 rounded-2xl border border-white/10 bg-ink px-3 py-2 shadow-[0_12px_35px_rgba(0,0,0,0.22)] sm:bottom-[12%] sm:right-[-3%] sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold text-white/55">Your trolley</p>
            <p className="mt-0.5 text-xs font-bold text-white sm:text-sm">No duplicates</p>
          </div>
        </div>
      </div>
    </section>
  );
}

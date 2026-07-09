"use client";

import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";
import { ProductPhone } from "./product-phone";

export function Hero() {
  const { open } = useWaitlist();

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 md:pb-28 md:pt-16 lg:px-10 lg:pb-36 lg:pt-20">
      <div className="mx-auto grid max-w-7xl items-center gap-6 sm:gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
        <div className="relative z-10 text-center lg:text-left">
          <p
            className="motion-safe:animate-rise text-xs font-bold uppercase tracking-[0.2em] text-brand-dot"
            style={{ animationDelay: "0s" }}
          >
            Swipe to fork
          </p>
          <h1
            className="motion-safe:animate-rise mt-4 text-balance text-[clamp(2.8rem,8vw,7.5rem)] font-bold leading-[0.92] tracking-[-0.06em] text-foreground sm:mt-5"
            style={{ animationDelay: "0.08s" }}
          >
            The recipes you save. Finally{" "}
            <span className="whitespace-nowrap">
              for dinner<span className="text-brand-dot">.</span>
            </span>
          </h1>
          <p
            className="motion-safe:animate-rise mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted sm:mt-7 sm:text-lg lg:mx-0 lg:max-w-lg"
            style={{ animationDelay: "0.16s" }}
          >
            Pick a recipe, build one tidy grocery list and get cooking. Foray
            keeps the whole journey in one calm place.
          </p>

          <div
            className="motion-safe:animate-rise mt-6 flex flex-row items-center justify-center gap-2 sm:mt-8 sm:gap-4 lg:justify-start"
            style={{ animationDelay: "0.24s" }}
          >
            {APP_STORE_LIVE ? (
              <a href={APP_STORE_URL} className="marketing-button">
                Download on the App Store <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <button type="button" onClick={open} className="marketing-button">
                Join the waitlist <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <a
              href="#how-it-works"
              className="rounded-full px-3 py-3 text-sm font-semibold text-foreground underline decoration-border underline-offset-8 transition-colors hover:decoration-foreground"
            >
              See how it works
            </a>
          </div>

          <ul
            className="motion-safe:animate-rise mt-8 hidden flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted sm:flex lg:justify-start"
            style={{ animationDelay: "0.32s" }}
          >
            {["Import any recipe", "One deduped list", "Shop online or in-store"].map(
              (item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-brand-dot" strokeWidth={2.5} />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        <div
          className="motion-safe:animate-rise relative mx-auto min-h-[370px] w-full max-w-[380px] sm:min-h-[560px] sm:max-w-[620px] lg:min-h-[620px]"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="absolute inset-x-[2%] top-[2%] h-[86%] overflow-hidden rounded-[36px] bg-[#f4eee4] sm:top-[3%] sm:h-[78%] sm:rounded-[64px]">
            <Image
              src="/brand/foray-kitchen-objects.png"
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
          <div className="absolute left-[1%] top-[15%] -rotate-6 rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-[0_12px_35px_rgba(35,25,12,0.12)] backdrop-blur-md sm:left-[-2%] sm:top-[22%] sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold text-muted">Saved from TikTok</p>
            <p className="mt-0.5 text-xs font-bold sm:text-sm">Ready to cook</p>
          </div>
          <div className="absolute bottom-[7%] right-[1%] rotate-3 rounded-xl border border-white/70 bg-white/85 px-3 py-2 shadow-[0_12px_35px_rgba(35,25,12,0.12)] backdrop-blur-md sm:bottom-[12%] sm:right-[-3%] sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="text-[10px] font-semibold text-muted">Your trolley</p>
            <p className="mt-0.5 text-xs font-bold sm:text-sm">No duplicates</p>
          </div>
        </div>
      </div>
    </section>
  );
}

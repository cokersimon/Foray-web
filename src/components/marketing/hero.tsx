"use client";

import Image from "next/image";
import { ForayIcon } from "@/components/brand/foray-icon";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";
import { ProductPhone } from "./product-phone";
import { cn } from "@/lib/cn";

const FLOATING_CARDS: {
  image: string;
  label: string;
  className: string;
}[] = [
  {
    image: "/brand/chip-save-time.png",
    label: "Save time",
    className: "left-0 top-[8%] -rotate-6 sm:left-[-3%] sm:top-[14%] lg:left-[-5%]",
  },
  {
    image: "/brand/chip-save-money.png",
    label: "Save money",
    className: "right-0 top-[6%] rotate-6 sm:right-[-3%] sm:top-[12%] lg:right-[-5%]",
  },
  {
    image: "/brand/chip-cook.png",
    label: "Cook",
    className:
      "bottom-[12%] left-0 -rotate-[5deg] sm:bottom-[16%] sm:left-[-4%] lg:bottom-[18%] lg:left-[-6%]",
  },
  {
    image: "/brand/chip-shop.png",
    label: "Shop",
    className:
      "bottom-[4%] right-0 rotate-3 sm:bottom-[8%] sm:right-[-3%] lg:bottom-[10%] lg:right-[-5%]",
  },
];

function FloatingCard({
  image,
  label,
  className,
}: {
  image: string;
  label: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "absolute z-20 flex w-[4.5rem] flex-col items-center gap-1 rounded-2xl border border-white/10 bg-ink px-2 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:w-[5.5rem] sm:gap-1.5 sm:rounded-[18px] sm:px-2.5 sm:py-2.5 lg:w-24",
        className,
      )}
    >
      <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-white sm:h-10 sm:w-10 sm:rounded-2xl lg:h-11 lg:w-11">
        <Image
          src={image}
          alt=""
          aria-hidden="true"
          fill
          sizes="44px"
          className="object-cover"
        />
      </div>
      <p className="text-center text-[9px] font-semibold leading-tight text-white sm:text-[10px] lg:text-[11px]">
        {label}
      </p>
    </div>
  );
}

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
            <p className="text-base font-normal leading-relaxed tracking-normal text-muted sm:text-lg">
              Launching soon
            </p>
          </div>
        </div>

        {/* Scale the whole composition as one unit — never crop the groceries. */}
        <div
          className="motion-safe:animate-rise relative mx-auto w-full max-w-[280px] sm:max-w-[480px] lg:max-w-[560px]"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="relative mx-auto aspect-square w-full">
            <div className="absolute inset-[8%] overflow-hidden rounded-[28px] bg-[#f5f5f7] sm:inset-[7%] sm:rounded-[40px] lg:rounded-[48px]">
              <Image
                src="/brand/foray-uk-groceries.png"
                alt=""
                aria-hidden="true"
                fill
                priority
                sizes="(max-width: 640px) 280px, (max-width: 1024px) 480px, 560px"
                className="object-contain p-2 sm:p-3"
              />
            </div>

            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <ProductPhone
                screen="recipes"
                className="w-[42%] max-w-[150px] sm:max-w-[220px] sm:w-[44%] lg:max-w-[250px]"
              />
            </div>

            {FLOATING_CARDS.map((card) => (
              <FloatingCard key={card.label} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

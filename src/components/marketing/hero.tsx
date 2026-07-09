"use client";

import Image from "next/image";
import { ForayIcon, type ForayIconName } from "@/components/brand/foray-icon";
import { APP_STORE_LIVE, APP_STORE_URL } from "@/lib/site";
import { useWaitlist } from "./waitlist-provider";
import { ProductPhone } from "./product-phone";
import { cn } from "@/lib/cn";

const FLOATING_CHIPS: {
  icon: ForayIconName;
  label: string;
  className: string;
}[] = [
  {
    icon: "heart",
    label: "Save recipes",
    className:
      "left-[1%] top-[15%] -rotate-6 sm:left-[-2%] sm:top-[22%]",
  },
  {
    icon: "clock",
    label: "Save time",
    className:
      "right-[1%] top-[12%] rotate-6 sm:right-[-2%] sm:top-[18%]",
  },
  {
    icon: "forkKnife",
    label: "Cook",
    className:
      "bottom-[18%] left-[1%] -rotate-[4deg] sm:bottom-[22%] sm:left-[-3%]",
  },
  {
    icon: "cart",
    label: "Shop",
    className:
      "bottom-[7%] right-[1%] rotate-3 sm:bottom-[12%] sm:right-[-3%]",
  },
];

function FloatingChip({
  icon,
  label,
  className,
}: {
  icon: ForayIconName;
  label: string;
  className: string;
}) {
  return (
    <div
      aria-label={label}
      title={label}
      className={cn(
        "absolute z-20 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-ink text-white shadow-[0_12px_35px_rgba(0,0,0,0.22)] sm:h-12 sm:w-12 sm:rounded-[18px]",
        className,
      )}
    >
      <ForayIcon name={icon} size={20} filled={icon === "heart"} className="sm:scale-110" />
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
          <div className="absolute inset-x-0 bottom-0 top-[8%] z-10 flex items-center justify-center">
            <ProductPhone
              screen="recipes"
              className="w-[168px] sm:w-[250px] lg:w-[270px]"
            />
          </div>
          {FLOATING_CHIPS.map((chip) => (
            <FloatingChip key={chip.label} {...chip} />
          ))}
        </div>
      </div>
    </section>
  );
}

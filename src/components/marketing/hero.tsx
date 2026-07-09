"use client";

import Image from "next/image";
import { SfSymbol, type SfSymbolName } from "@/components/brand/sf-symbol";
import { AppStoreBadge } from "./app-store-badge";
import { ProductPhone } from "./product-phone";
import { cn } from "@/lib/cn";

const FLOATING_CARDS: {
  icon: SfSymbolName;
  label: string;
  className: string;
}[] = [
  {
    icon: "clock",
    label: "Save time",
    className: "left-[1%] top-[15%] -rotate-6 sm:left-[-2%] sm:top-[22%]",
  },
  {
    icon: "banknote",
    label: "Save money",
    className: "right-[1%] top-[12%] rotate-6 sm:right-[-2%] sm:top-[18%]",
  },
  {
    icon: "forkKnife",
    label: "Cook",
    className:
      "bottom-[16%] left-[1%] -rotate-[4deg] sm:bottom-[20%] sm:left-[-3%]",
  },
  {
    icon: "cart",
    label: "Shop",
    className:
      "bottom-[5%] right-[1%] rotate-3 sm:bottom-[10%] sm:right-[-3%]",
  },
];

function FloatingCard({
  icon,
  label,
  className,
}: {
  icon: SfSymbolName;
  label: string;
  className: string;
}) {
  return (
    <div
      className={cn(
        "absolute z-20 flex w-[5.25rem] flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-ink px-2.5 py-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.22)] sm:w-[6.25rem] sm:gap-2 sm:rounded-[18px] sm:px-3 sm:py-3 lg:w-[7rem]",
        className,
      )}
    >
      <SfSymbol
        name={icon}
        size="feature"
        className="text-white"
      />
      <p className="text-center text-[10px] font-semibold leading-tight text-white sm:text-[11px] lg:text-xs">
        {label}
      </p>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-background px-5 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 md:pb-28 md:pt-28 lg:px-10 lg:pb-32 lg:pt-32">
      <div className="mx-auto grid max-w-7xl items-center gap-8 sm:gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
        <div className="relative z-10 text-center lg:text-left">
          <h1
            className="motion-safe:animate-rise text-balance text-[clamp(2.6rem,7.2vw,5.75rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground"
            style={{ animationDelay: "0s" }}
          >
            Swipe. Shop. Cook
            <span className="text-brand-dot">.</span>
          </h1>
          <p
            className="motion-safe:animate-rise mx-auto mt-5 max-w-md text-pretty text-base leading-relaxed text-muted sm:mt-6 sm:text-lg lg:mx-0"
            style={{ animationDelay: "0.16s" }}
          >
            Swipe through recipes, tap to add, and your trolley builds itself.
            Foray fills your online basket for you, or shop in person.
          </p>

          <div
            className="motion-safe:animate-rise mt-7 flex justify-center sm:mt-8 lg:justify-start"
            style={{ animationDelay: "0.24s" }}
          >
            <AppStoreBadge />
          </div>
        </div>

        <div
          className="motion-safe:animate-rise relative mx-auto min-h-[370px] w-full max-w-[380px] sm:min-h-[560px] sm:max-w-[620px] lg:min-h-[600px]"
          style={{ animationDelay: "0.18s" }}
        >
          <div className="absolute inset-x-[2%] top-[2%] h-[86%] overflow-hidden rounded-[36px] bg-section-grey sm:top-[3%] sm:h-[78%] sm:rounded-[48px]">
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
          {FLOATING_CARDS.map((card) => (
            <FloatingCard key={card.label} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
}

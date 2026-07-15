import Image from "next/image";

export function About() {
  return (
    <section
      id="about"
      className="bg-section-grey px-(--gutter) py-[clamp(5rem,2.9375rem+8.5vw,8rem)]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-y-8 motion-safe:transition-[column-gap] motion-safe:duration-200 motion-safe:ease-out desk:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)] desk:items-stretch desk:gap-x-12 desk:gap-y-8 xl:gap-x-16">
          <h2 className="order-1 text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground desk:col-start-2 desk:row-start-1">
            Why I built Foray<span className="text-brand-dot">.</span>
          </h2>

          <figure className="relative order-2 mx-auto aspect-[3/4] w-full max-w-[clamp(24rem,17.76rem+25.6vw,28rem)] isolate overflow-hidden rounded-[28px] desk:order-none desk:col-start-1 desk:row-span-2 desk:row-start-1 desk:mx-0 desk:aspect-auto desk:h-full desk:max-w-none desk:min-h-0">
            <Image
              src="/brand/simon-founder.jpg"
              alt="Simon, founder of Foray"
              fill
              sizes="(max-width: 70rem) 28rem, 22rem"
              className="origin-top scale-[1.04] object-cover object-top"
            />
          </figure>

          <div className="order-3 space-y-5 text-pretty text-base leading-relaxed text-muted sm:text-lg desk:col-start-2 desk:row-start-2 desk:self-start">
            <p>
              Foray started in my own kitchen. I struggled to find time to cook
              interesting meals and stick to good habits, so I kept falling back
              on takeaways, which did my health goals and my wallet no favours.
              The recipes I actually wanted to cook were scattered across
              Instagram, TikTok and screenshots. I would forget half the
              ingredients at the shop and go back twice in a week, or overbuy and
              watch food go to waste.
            </p>
            <p>
              Foray is my answer to all of that. One calm place for the recipes
              you save, a trolley that builds itself, and the choice to check out
              online or pick things up in person. It exists to hand you back your
              time for family, hobbies and trying something new, while helping
              you eat better and spend less.
            </p>
            <p>And a few things Foray will always stand for:</p>
            <p>
              <span className="font-semibold text-foreground">
                Your data isn&apos;t the product.
              </span>{" "}
              We keep analytics off by default, and there are absolutely no ads.
            </p>
            <p>
              <span className="font-semibold text-foreground">
                Calm by design.
              </span>{" "}
              Foray is designed to help you get in and get out: plan, shop, cook,
              and get on with your evening.
            </p>
            <p>
              <span className="font-semibold text-foreground">
                No hidden prices.
              </span>{" "}
              Every fee is shown before you pay, and cancelling takes a minute in
              the App Store.
            </p>
            <p className="pt-4">
              <span className="font-wordmark block text-[1.85rem] leading-none text-foreground sm:text-[2.1rem]">
                Simon
              </span>
              <span className="mt-1.5 block text-base font-semibold text-foreground sm:text-lg">
                founder of Foray
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

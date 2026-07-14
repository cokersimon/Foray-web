export function About() {
  return (
    <section
      id="about"
      className="bg-section-grey px-5 py-20 sm:px-6 md:py-28 lg:px-10 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="text-balance text-[clamp(2.4rem,5vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-foreground">
            Why I built Foray<span className="text-brand-dot">.</span>
          </h2>
          <div className="mt-8 space-y-5 text-pretty text-base leading-relaxed text-muted sm:text-lg">
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
            <p className="pt-2 font-semibold text-foreground">
              Simon, founder of Foray
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

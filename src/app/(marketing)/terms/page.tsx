import type { Metadata } from "next";
import Link from "next/link";
import { DraftBanner } from "@/components/legal/draft-banner";

export const metadata: Metadata = {
  title: "Terms & Conditions — Foray",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="pt-4 text-xl font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">

      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Terms &amp; Conditions
      </h1>
      <p className="mt-3 text-sm text-muted">Last updated: 3 June 2026 · Effective date: [set at publication]</p>

      <div className="mt-10">
        <DraftBanner />
      </div>

      <div className="space-y-6 text-base leading-relaxed text-muted">
        <p>
          These Terms &amp; Conditions (&ldquo;Terms&rdquo;) are a contract
          between you and [LEGAL ENTITY NAME] (&ldquo;Foray,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;) governing your use of the Foray iOS
          app, this website, and related services (the &ldquo;Service&rdquo;).
          Your use is also governed by our{" "}
          <Link href="/privacy" className="text-foreground underline">
            Privacy Policy
          </Link>{" "}
          and, where relevant, by Apple&rsquo;s standard EULA and the terms of
          the retailers and partners you check out with.
        </p>

        <Section title="1. Acceptance & eligibility">
          <p>
            By creating an account or using the Service, you agree to these
            Terms. You must be at least 13 years old. Some features, such as paid
            subscriptions, may require you to be the age of majority in your
            jurisdiction.
          </p>
        </Section>

        <Section title="2. What the Service does">
          <p>
            Foray lets you import recipes (by link, photo, or manual entry, parsed
            by our AI &ldquo;the Chef&rdquo;), plan meals with swipe-based
            planning, build a deduplicated grocery list, shop in person for free
            or check out online via a retailer/partner, and cook with step-by-step
            cook mode and timers. We may change, add, or remove features.
          </p>
        </Section>

        <Section title="3. Accounts">
          <p>
            You sign in with Sign in with Apple or an emailed 6-digit code. You
            are responsible for activity under your account. You may delete your
            account at any time in Settings; deletion removes your data as
            described in the Privacy Policy and is irreversible.
          </p>
        </Section>

        <Section title="4. Subscriptions, trial & billing">
          <p>
            The core funnel (import, plan, deduplicated list, in-person shopping,
            cook mode) is free, with a one-week full trial for new users. Foray
            Premium unlocks AI and convenience features for [£4.99 per month —
            confirm], localised per region.{" "}
            <strong className="text-foreground">
              Subscriptions are sold and billed by Apple
            </strong>{" "}
            through the App Store and auto-renew unless cancelled at least 24
            hours before the period ends. Manage or cancel anytime in Apple ID
            &rarr; Subscriptions.
          </p>
        </Section>

        <Section title="5. Online-checkout convenience charge">
          <p>
            When you choose to check out online, a convenience charge of{" "}
            <strong className="text-foreground">£2.49 per order</strong> [confirm]
            applies, localised per currency. It is collected via Stripe through an
            Apple Pay sheet before we hand off to the retailer (not via Apple
            in-app purchase), is separate from Premium, and is shown before you
            commit and as a line item in your order summary.{" "}
            <strong className="text-foreground">In-person shopping is always free.</strong>
          </p>
        </Section>

        <Section title="6. Groceries, retailers & the merchant-of-record boundary">
          <p>
            Foray facilitates; it does not sell groceries. Foray is not the
            merchant of record. When you check out online, the retailer/partner is
            the seller and is responsible for the goods, pricing accuracy at
            their checkout, availability, substitutions, fulfilment, delivery,
            refunds, and consumer-law obligations. Payment for groceries happens
            in the retailer/partner surface. Our convenience charge buys the
            handoff service, not the groceries.
          </p>
        </Section>

        <Section title="7. AI output — accuracy & no advice">
          <p>
            Recipes and content generated or parsed by AI may be incomplete or
            inaccurate. You must verify ingredients, quantities, and steps before
            shopping, cooking, or eating. Nutrition information is informational
            only; Foray makes no medical or health claims.{" "}
            <strong className="text-foreground">
              Allergen flags are informational and not guaranteed
            </strong>{" "}
            — if you have an allergy or intolerance, always check product
            packaging and the original source.
          </p>
        </Section>

        <Section title="8. User content & social import">
          <p>
            You are responsible for the links, photos, text, and recipes you
            import or create, and confirm you have the right to use them for
            personal meal planning. We extract structured facts, store a link back
            to the original, attribute the creator where available, and do not
            re-host creators&rsquo; media or republish your imports to other
            users. Rights holders can request takedown at [legal@forayapp.co.uk].
          </p>
        </Section>

        <Section title="9. Acceptable use">
          <p>
            Don&rsquo;t break the law, infringe others&rsquo; rights, scrape,
            overload, reverse-engineer, or disrupt the Service or our partners,
            bypass usage limits or paywalls, or misuse import to bulk-copy
            creators&rsquo; content. We may rate-limit, suspend, or terminate
            accounts that breach these Terms.
          </p>
        </Section>

        <Section title="10. Disclaimers & limitation of liability">
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available.&rdquo; To the fullest extent permitted by law, we disclaim
            implied warranties and are not liable for indirect or consequential
            losses, or for the goods, services, acts, or omissions of third-party
            retailers/partners. Nothing excludes liability that cannot be excluded
            by law, and UK/EU consumer statutory rights (e.g. the Consumer Rights
            Act 2015) are unaffected.
          </p>
        </Section>

        <Section title="11. Governing law">
          <p>
            For UK users, these Terms are governed by the laws of England and
            Wales, whose courts have jurisdiction, without depriving consumers of
            mandatory home-country protections. EU users keep their mandatory
            consumer protections. [Confirm US governing law/venue before US
            launch.]
          </p>
        </Section>

        <Section title="12. Changes & contact">
          <p>
            We may update these Terms and will revise the &ldquo;last
            updated&rdquo; date, notifying you of material changes. [LEGAL ENTITY
            NAME], [ADDRESS]. Questions: [support@forayapp.co.uk /
            legal@forayapp.co.uk].
          </p>
        </Section>
      </div>
    </div>
  );
}

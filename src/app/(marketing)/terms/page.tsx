import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocLayout } from "@/components/legal/legal-doc-layout";
import {
  LegalSection,
  sectionIdFromTitle,
  type LegalNavSection,
} from "@/components/legal/legal-section";
import {
  LEGAL_ENTITY,
  postalContactLine,
  registeredOfficeLine,
} from "@/lib/legal-entity";
import { fetchStorePricing, formatPricing } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Terms & Conditions · Foray",
};

const TERMS_SECTION_TITLES = [
  "1. Acceptance & eligibility",
  "2. What the Service does",
  "3. Accounts",
  "4. Subscriptions, trial & billing",
  "5. Online-checkout convenience charge",
  "6. Groceries, retailers & merchant-of-record",
  "7. AI output: accuracy & no advice",
  "8. User content & social-media import",
  "9. Acceptable use",
  "10. Disclaimers & limitation of liability",
  "11. Governing law",
  "12. Changes & contact",
] as const;

const TERMS_SECTIONS: LegalNavSection[] = TERMS_SECTION_TITLES.map((title) => ({
  id: sectionIdFromTitle(title),
  title,
}));

export default async function TermsPage() {
  const pricing = formatPricing(await fetchStorePricing());
  return (
    <LegalDocLayout sections={TERMS_SECTIONS}>
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-12 lg:pb-24 lg:pt-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Terms &amp; Conditions
        </h1>
        <p className="mt-3 text-sm text-muted">
          Effective date: {LEGAL_ENTITY.effectiveDate} · Last updated:{" "}
          {LEGAL_ENTITY.lastUpdated}
        </p>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted">
          <p>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) are a contract
            between you and{" "}
            <strong className="text-foreground">{LEGAL_ENTITY.legalName}</strong>{" "}
            (&ldquo;Foray,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), a company
            registered in England and Wales (company number{" "}
            {LEGAL_ENTITY.companyNumber}) with its registered office at{" "}
            {registeredOfficeLine(true)}, governing your use of the Foray iOS
            app, this website, and related services (the &ldquo;Service&rdquo;).
            Your use is also governed by our{" "}
            <Link href="/privacy" className="text-foreground underline">
              Privacy Policy
            </Link>
            , and where relevant by Apple&rsquo;s standard EULA and the terms
            of the retailers and partners you check out with.
          </p>

          <LegalSection title="1. Acceptance & eligibility">
            <p>
              By creating an account or using the Service, you agree to these
              Terms. You must be at least 13 years old. If you are under 18, you
              must have a parent or guardian&rsquo;s permission to purchase a paid
              subscription or make payments through the Service.
            </p>
          </LegalSection>

          <LegalSection title="2. What the Service does">
            <p>
              Foray lets you create recipes (import a link, generate from a prompt,
              photo of a dish or written recipe, or pantry photo with confirmation),
              plan meals, build a deduplicated grocery list matched to your chosen
              supermarket, shop in person for free or check out online via a
              retailer/partner, and cook with step-by-step cook mode and timers. You
              can also use Foray via Siri, Shortcuts, Spotlight, and widgets where
              supported. We may change, add, or remove features.
            </p>
          </LegalSection>

          <LegalSection title="3. Accounts">
            <p>
              You sign in with Sign in with Apple or an emailed 6-digit code. You
              are responsible for activity under your account. You may delete your
              account at any time in Settings; deletion removes your data as
              described in the Privacy Policy and is irreversible.
            </p>
          </LegalSection>

          <LegalSection title="4. Subscriptions, trial & billing">
            <p>
              The core funnel is free. Foray Pro is one yearly subscription with
              two ways to pay:{" "}
              <strong className="text-foreground">
                monthly at {pricing.monthly}/month for 12 months ({pricing.total}{" "}
                total, a 12-month commitment)
              </strong>{" "}
              or save with one up-front payment of {pricing.upFront} for the year.
              New users may start a 7-day free trial on the monthly commitment plan
              via Apple StoreKit;
              you are not charged until the trial ends. Cancelling during the free
              trial ends the subscription with nothing owed.{" "}
              <strong className="text-foreground">
                Cancelling a monthly plan after the trial converts does not stop
                the remaining monthly payments
              </strong>
              &nbsp;&mdash; billing continues through all 12 payments and
              cancellation stops the plan renewing into another 12-month term.
              The up-front yearly plan renews annually unless cancelled at least
              24 hours before renewal. AI creation features are subject to
              fair-use allowances (trial: 3 uses; Pro: monthly soft cap).{" "}
              <strong className="text-foreground">
                Subscriptions are sold and billed by Apple
              </strong>{" "}
              through the App Store.
            </p>
          </LegalSection>

          <LegalSection title="5. Online-checkout convenience charge">
            <p>
              When you check out online, a convenience charge of{" "}
              <strong className="text-foreground">
                {pricing.convenienceFee} per order
              </strong>{" "}
              applies, localised per currency. It is collected via Stripe through an
              Apple Pay sheet before handoff to the retailer (not via Apple in-app
              purchase), is separate from Pro, and is shown before you commit.{" "}
              <strong className="text-foreground">
                In-person shopping is always free.
              </strong>
            </p>
          </LegalSection>

          <LegalSection title="6. Groceries, retailers & merchant-of-record">
            <p>
              Foray facilitates; it does not sell groceries. Foray is not the
              merchant of record. When you check out online, the retailer/partner is
              the seller and is responsible for the goods, pricing, availability,
              fulfilment, and refunds. Payment for groceries happens in the
              retailer/partner surface. Our convenience charge buys the handoff
              service, not the groceries.
            </p>
          </LegalSection>

          <LegalSection title="7. AI output: accuracy & no advice">
            <p>
              Recipes produced by AI may be incomplete or inaccurate. You must
              verify ingredients, quantities, and steps before shopping or cooking.
              Nutrition information is informational only; Foray makes no medical or
              health claims. Allergen flags are informational and not guaranteed. If
              you have an allergy, always check product packaging and the original
              source. Product matches and prices are estimates; the
              retailer&rsquo;s checkout price governs.
            </p>
          </LegalSection>

          <LegalSection title="8. User content & social-media import">
            <p>
              The import feature is a personal organisational tool for your own
              private, non-commercial meal planning, not a publishing or
              redistribution service. Imported recipes are private to your account.
              You are responsible for each import and must use it for personal use
              only. Foray provides the tool; you choose and supply the content. We
              extract structured facts, store a link back to the original, and
              attribute the creator where available.
            </p>
            <p>
              Rights holders may contact{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.legalEmail}`}
                className="text-foreground underline"
              >
                {LEGAL_ENTITY.legalEmail}
              </a>{" "}
              with takedown requests. AI-generated recipes are produced at your
              request; you must not present them as the work of any specific creator,
              restaurant, or brand.
            </p>
          </LegalSection>

          <LegalSection title="9. Acceptable use">
            <p>
              Don&rsquo;t break the law, infringe others&rsquo; rights, scrape or
              disrupt the Service, bypass usage limits or paywalls, misuse import for
              bulk-copy or commercial exploitation, or upload malicious material. We
              may suspend or terminate accounts that breach these Terms.
            </p>
          </LegalSection>

          <LegalSection title="10. Disclaimers & limitation of liability">
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available.&rdquo; To the fullest extent permitted by law, we disclaim
              implied warranties and are not liable for indirect or consequential
              losses, or for third-party retailers&rsquo; acts or omissions. Our
              total aggregate liability is limited to the greater of the amount you
              paid us in the 12 months before the claim or £100. Nothing excludes
              liability that cannot be excluded by law; UK/EU consumer statutory
              rights are unaffected.
            </p>
          </LegalSection>

          <LegalSection title="11. Governing law">
            <p>
              These Terms are governed by the laws of England and Wales. If you are a
              consumer resident in the UK or EU, this does not deprive you of
              mandatory consumer protections in your country of residence. The Service
              is currently offered in the United Kingdom.
            </p>
          </LegalSection>

          <LegalSection title="12. Changes & contact">
            <p>
              We may update these Terms and will revise the &ldquo;last
              updated&rdquo; date; for material changes we will notify you in-app or
              by email. {postalContactLine()} Questions:{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.supportEmail}`}
                className="text-foreground underline"
              >
                {LEGAL_ENTITY.supportEmail}
              </a>{" "}
              · Legal/rights matters:{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.legalEmail}`}
                className="text-foreground underline"
              >
                {LEGAL_ENTITY.legalEmail}
              </a>
              .
            </p>
          </LegalSection>
        </div>
      </div>
    </LegalDocLayout>
  );
}

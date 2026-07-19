import type { Metadata } from "next";
import { LegalDocLayout } from "@/components/legal/legal-doc-layout";
import {
  LegalSection,
  sectionIdFromTitle,
  type LegalNavSection,
} from "@/components/legal/legal-section";
import {
  dataControllerLine,
  LEGAL_ENTITY,
  postalContactLine,
} from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "Privacy Policy · Foray",
};

const SUBPROCESSORS: {
  name: string;
  purpose: string;
  data: string;
  region: string;
}[] = [
  {
    name: "Supabase (incl. Supabase Auth)",
    purpose:
      "Backend, database, storage, authentication, and hosting (sync, Chef pipeline, Sign in with Apple + email sign-in).",
    data: "Account, auth identifier, recipes, plans, lists, shopping history, settings, AI usage records, private import images, session metadata.",
    region: "AWS eu-west-1 (Ireland, EEA)",
  },
  {
    name: "Resend",
    purpose: "Sending authentication emails (the 6-digit sign-in code).",
    data: "Your email address + the code email.",
    region: "United States; SCCs / UK Addendum",
  },
  {
    name: "Pepesto",
    purpose: "Grocery catalogue/pricing and online-checkout handoff to retailers.",
    data: "Cart items, store selection; no Foray-held card data.",
    region: "Switzerland; UK adequacy / equivalent safeguards",
  },
  {
    name: "Google (Gemini API)",
    purpose:
      'The AI provider behind "the Chef": parsing imports, generating recipes, photo identification, product matching.',
    data: "Imported link content/text, generation prompts, dish/recipe/ingredient photos.",
    region: "Google Cloud; paid API terms; SCCs / UK Addendum",
  },
  {
    name: "Recraft",
    purpose: "Generating illustrated hero images for AI-created recipes.",
    data: "Recipe title/description only. No personal data.",
    region: "No personal data is shared",
  },
  {
    name: "Apple (APNs)",
    purpose: "Delivering push notifications.",
    data: "Device token + notification payload.",
    region: "Apple infrastructure",
  },
  {
    name: "Apple (App Store / StoreKit)",
    purpose:
      "Billing the Pro subscription (incl. App Store Server Notifications for renewals/refunds).",
    data: "Purchase/entitlement status.",
    region: "Apple is the seller of the subscription",
  },
  {
    name: "Sentry",
    purpose: "Crash and error diagnostics (only if you opt in to diagnostics).",
    data: "Crash context only: screen id, build, OS, device model. No names, recipe text, or tokens.",
    region: "EU data-residency deployment",
  },
  {
    name: "Stripe",
    purpose:
      "Processing the online-checkout convenience fee (presented via an Apple Pay sheet).",
    data: "Transaction status; no Foray-held full card data.",
    region: "SCCs / UK Addendum",
  },
];

const PRIVACY_SECTION_TITLES = [
  "1. Who we are",
  "2. The data we collect, and why",
  "3. How we use your data (lawful bases)",
  "4. Payments & retailer checkout",
  "5. AI recipe creation and imported social content",
  "6. Who we share data with (subprocessors)",
  "7. International transfers",
  "8. Retention",
  "9. Marketing & communications",
  "10. Your rights",
  "11. Automated decision-making",
  "12. Children",
  "13. Security",
  "14. Siri, Shortcuts & widgets",
  "15. Cookies on this website",
  "16. Third-party links & corporate transactions",
  "17. Changes & contact",
] as const;

const PRIVACY_SECTIONS: LegalNavSection[] = PRIVACY_SECTION_TITLES.map(
  (title) => ({
    id:
      title === "5. AI recipe creation and imported social content"
        ? "chef-ai"
        : sectionIdFromTitle(title),
    title,
  }),
);

export default function PrivacyPage() {
  return (
    <LegalDocLayout sections={PRIVACY_SECTIONS}>
      <div className="mx-auto max-w-3xl px-6 pb-16 pt-12 lg:pb-24 lg:pt-16">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted">
          Effective date: {LEGAL_ENTITY.effectiveDate} · Last updated:{" "}
          {LEGAL_ENTITY.lastUpdated}
        </p>

        <div className="mt-10 space-y-6 text-base leading-relaxed text-muted">
          <p>
            This policy explains what personal data {LEGAL_ENTITY.legalName}{" "}
            (&ldquo;Foray,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects,
            why, who we share it with, and the rights you have. It covers the
            Foray iOS app, this website, and related services.
          </p>

          <LegalSection title="1. Who we are">
            <p>
              <strong className="text-foreground">Service:</strong> Foray turns
              social-media recipes into meal plans, a deduplicated grocery list,
              online/in-person checkout, and a cook mode.
            </p>
            <p>
              <strong className="text-foreground">Data controller:</strong>{" "}
              {dataControllerLine()}
            </p>
            <p>
              <strong className="text-foreground">Contact (privacy):</strong>{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.privacyEmail}`}
                className="text-foreground underline"
              >
                {LEGAL_ENTITY.privacyEmail}
              </a>
            </p>
            <p>
              We have not appointed a Data Protection Officer, as we are not
              required to do so given the nature and scale of our processing.
            </p>
            <p>
              For UK/EU users, the relevant supervisory authority is the UK
              Information Commissioner&rsquo;s Office (ICO) (and your local EU
              data protection authority for EU residents).
            </p>
          </LegalSection>

          <LegalSection title="2. The data we collect, and why">
            <p>
              We practise data minimisation: the only universally required
              personal data is your{" "}
              <strong className="text-foreground">name</strong>. Everything else
              is collected only when a feature you use needs it, for example your
              account identifier, saved and AI-generated recipes, meal plans,
              grocery lists, shopping history, store preference (chosen
              manually), dietary/allergen settings, subscription status, and
              (with permission) notification tokens.
            </p>
            <p>
              Diagnostics and product analytics are{" "}
              <strong className="text-foreground">
                opt-in and off by default
              </strong>{" "}
              in the UK/EU. We do not collect your location. You choose your
              store manually. We do not collect unnecessary demographics or your
              contacts, and we do not perform tracking-based advertising.
            </p>
          </LegalSection>

          <LegalSection title="3. How we use your data (lawful bases)">
            <p>
              Under the UK GDPR we process personal data only where we have a
              lawful basis:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-foreground">Contract</strong> — to create
                and maintain your account, meal plans, grocery lists, Chef AI
                recipes you request, and checkout handoff features you use.
              </li>
              <li>
                <strong className="text-foreground">
                  Explicit consent (UK GDPR Article 9(2)(a))
                </strong>{" "}
                —                 allergy and other health-related dietary information is
                special-category data. We store and use it only with your{" "}
                <strong className="text-foreground">explicit consent</strong>,
                collected when you provide those details (for example during
                onboarding). You can withdraw that consent in Settings or by
                contacting us; we will then stop that processing and delete or
                stop using the health data where legally possible.
              </li>
              <li>
                <strong className="text-foreground">Consent</strong> — optional
                diagnostics and product analytics (off by default in the UK/EU);
                website Google Analytics (cookie banner); including allergies in
                Chef AI requests when you enable{" "}
                <em>Personalise with Chef AI</em>; and push notifications where
                your device permission is required.
              </li>
              <li>
                <strong className="text-foreground">Legitimate interests</strong>{" "}
                — securing the Service, preventing fraud and abuse, and improving
                reliability where we do not rely on consent (balanced against your
                rights).
              </li>
              <li>
                <strong className="text-foreground">Legal obligation</strong> —
                retaining certain transaction records (for example the
                convenience charge) where UK law requires it.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="4. Payments & retailer checkout">
            <p>
              Foray is{" "}
              <strong className="text-foreground">
                not the merchant of record
              </strong>{" "}
              for groceries. Grocery payment happens in the retailer/partner
              surface. We do not collect or store your card or payment-card
              details. App subscriptions are billed by Apple via the App Store.
              The online-checkout convenience charge is processed by Stripe
              through an Apple Pay sheet. We receive only transaction status from
              Stripe, never your full card details.
            </p>
            <p>
              When you sign in to a supermarket for online checkout, that sign-in
              happens in a{" "}
              <strong className="text-foreground">secure in-app web view</strong>
              . Your retailer username and password are sent to the retailer, not
              to Foray. We do not store those credentials. Retailer session
              cookies and related local data for that web view are cleared when
              you delete your Foray account.
            </p>
          </LegalSection>

          <LegalSection
            id="chef-ai"
            title="5. AI recipe creation and imported social content"
          >
            <p>
              Foray offers four ways to create a recipe, all processed by our AI
              pipeline (&ldquo;Chef AI&rdquo;, &ldquo;the Chef&rdquo;): import
              from a link; generate from a prompt (including via Siri); photo of
              a dish or written recipe; pantry photo of ingredients you have (you
              confirm before generating; we do not build a kitchen inventory).
              Content you provide is sent to our AI provider,{" "}
              <strong className="text-foreground">Google (Gemini API)</strong>,
              to produce a structured recipe (see the subprocessors table below).
              We store the result privately on your account; for social imports
              we keep a link back to the original and do not republish your
              imports to other users. Where your device supports it, limited
              processing may run on-device; that is not a Foray cloud
              subprocessor.
            </p>
            <p>
              <strong className="text-foreground">
                Dietary personalisation is off by default.
              </strong>{" "}
              Your allergies and dietary preferences are included in a Chef AI
              request only if you turn on{" "}
              <em>Personalise with Chef AI</em> in Settings → AI Privacy &amp;
              Usage. You can turn it off at any time. Filtering of catalogue
              recipes by your allergies works on your device and does not depend
              on this setting.
            </p>
            <p>
              AI output may be inaccurate. Always verify ingredients, and never
              rely on it for allergen safety.
            </p>
          </LegalSection>

          <LegalSection title="6. Who we share data with (subprocessors)">
            <p>
              We share the minimum necessary with vetted providers acting on our
              instructions under data-processing agreements or equivalent
              safeguards:
            </p>
            <div className="overflow-hidden rounded-2xl border border-border">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 font-semibold text-foreground">
                      Subprocessor
                    </th>
                    <th className="px-4 py-3 font-semibold text-foreground">
                      Purpose
                    </th>
                    <th className="px-4 py-3 font-semibold text-foreground">
                      Data involved
                    </th>
                    <th className="px-4 py-3 font-semibold text-foreground">
                      Region
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SUBPROCESSORS.map((sp) => (
                    <tr
                      key={sp.name}
                      className="border-b border-border align-top last:border-0"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {sp.name}
                      </td>
                      <td className="px-4 py-3">{sp.purpose}</td>
                      <td className="px-4 py-3">{sp.data}</td>
                      <td className="px-4 py-3">{sp.region}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Pepesto receives cart items and store selection so we can show
              catalogue pricing and hand you to the retailer&rsquo;s checkout. The
              retailer is a separate controller for payment and fulfilment; their
              privacy notice applies to that stage.
            </p>
          </LegalSection>

          <LegalSection title="7. International transfers">
            <p>
              Our primary data processing takes place in the EEA (AWS eu-west-1,
              Ireland). Where data is processed outside the UK/EEA, we rely on an
              adequacy decision (for example Switzerland), the UK International
              Data Transfer Agreement / Addendum and/or EU Standard Contractual
              Clauses, plus supplementary measures where appropriate.
            </p>
          </LegalSection>

          <LegalSection title="8. Retention">
            <p>
              We keep your personal data while your account is active. When you
              delete your account, we delete your records, wipe local on-device
              data (including retailer web-view session data), and revoke tokens;
              backup copies are purged within 30 days. Diagnostics (if opted in)
              are retained up to 90 days; analytics up to 12 months. Transaction
              records for the convenience charge are retained as required by law
              (generally 6 years in the UK).
            </p>
          </LegalSection>

          <LegalSection title="9. Marketing & communications">
            <p>
              We send{" "}
              <strong className="text-foreground">transactional emails</strong>{" "}
              needed to operate your account (for example the 6-digit sign-in
              code via Resend). Those are not marketing.
            </p>
            <p>
              <strong className="text-foreground">Push notifications</strong>{" "}
              are delivered only if you grant permission on your device. You can
              turn them off in iOS Settings or in the app. We do not sell your
              data to advertisers or run tracking-based advertising.
            </p>
            <p>
              We do not currently send promotional email or SMS marketing. If we
              introduce that later, we will only do so with a lawful basis
              (consent or soft opt-in where PECR allows) and an unsubscribe path
              in each message.
            </p>
          </LegalSection>

          <LegalSection title="10. Your rights">
            <p>
              You can access, export, rectify, and erase your data, withdraw
              consent (including for allergy/health data and optional analytics),
              and restrict or object to certain processing, from in-app Settings
              or by contacting {LEGAL_ENTITY.privacyEmail}. UK/EU users have
              rights under UK and EU GDPR. US/California residents have rights to
              know, access, delete, and correct. We do not sell or share personal
              data as those terms are defined.
            </p>
          </LegalSection>

          <LegalSection title="11. Automated decision-making">
            <p>
              We use personalisation and AI to recommend recipes, plans, and
              baskets, but we do{" "}
              <strong className="text-foreground">not</strong> make automated
              decisions that have legal or similarly significant effects on you.
            </p>
          </LegalSection>

          <LegalSection title="12. Children">
            <p>
              Foray is intended for users aged 13 and over. We do not knowingly
              collect personal data from children under 13. Contact{" "}
              {LEGAL_ENTITY.privacyEmail} if you believe a child under 13 has
              provided us data.
            </p>
          </LegalSection>

          <LegalSection title="13. Security">
            <p>
              On-device data is encrypted at rest by iOS Data Protection; auth
              tokens are stored in the iOS Keychain. Network traffic uses TLS;
              backend functions apply least-privilege authorisation and ownership
              checks.
            </p>
          </LegalSection>

          <LegalSection title="14. Siri, Shortcuts & widgets">
            <p>
              If you use Foray through Siri, Shortcuts, Spotlight, or widgets,
              your spoken request is processed by Apple under Apple&rsquo;s
              terms; Foray receives the resulting structured request and handles
              it like the equivalent in-app action. We don&rsquo;t receive or
              store your voice audio.
            </p>
          </LegalSection>

          <LegalSection title="15. Cookies on this website">
            <p>
              This website sets no marketing or tracking cookies by default. When
              you make a choice in our cookie banner, we store it as{" "}
              <code className="text-foreground">foray-consent</code> (a
              strictly-necessary cookie plus a browser localStorage entry, kept
              for about 6 months). Only if you choose &ldquo;Accept&rdquo; do we
              load Google Analytics. Signing in to the admin area uses
              strictly-necessary authentication cookies.
            </p>
          </LegalSection>

          <LegalSection title="16. Third-party links & corporate transactions">
            <p>
              The Service links to external sites and retailer checkouts. Their
              privacy practices are their own; please review their notices.
            </p>
            <p>
              If we sell or transfer all or part of our business, personal data
              relevant to that part may transfer to the buyer under appropriate
              safeguards, and only for purposes consistent with this policy.
            </p>
          </LegalSection>

          <LegalSection title="17. Changes & contact">
            <p>
              We may update this policy and will revise the &ldquo;last
              updated&rdquo; date; for material changes we will notify you
              in-app or by email. Questions or requests:{" "}
              <a
                href={`mailto:${LEGAL_ENTITY.privacyEmail}`}
                className="text-foreground underline"
              >
                {LEGAL_ENTITY.privacyEmail}
              </a>{" "}
              · {postalContactLine()} UK/EU users may also contact the ICO or
              their local data protection authority.
            </p>
          </LegalSection>
        </div>
      </div>
    </LegalDocLayout>
  );
}

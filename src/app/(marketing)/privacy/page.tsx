import type { Metadata } from "next";
import { LegalSection } from "@/components/legal/legal-section";
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
    region: "Safeguarded per section 5",
  },
  {
    name: "Google (Gemini API)",
    purpose:
      'The AI provider behind "the Chef": parsing imports, generating recipes, photo identification, product matching.',
    data: "Imported link content/text, generation prompts, dish/recipe/ingredient photos.",
    region: "Google Cloud; paid API terms; SCCs / UK Addendum",
  },
  {
    name: "Apple (Private Cloud Compute / on-device intelligence)",
    purpose:
      "Where your device supports it, parts of AI processing run on-device or on Apple's Private Cloud Compute.",
    data: "The content being processed; Apple states PCC data is not retained or accessible to Apple.",
    region: "Apple infrastructure",
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
  {
    name: "Logo.dev",
    purpose: "Rendering retailer brand logos in the store picker.",
    data: "Retailer domain + publishable API token only. No user personal data.",
    region: "No personal data is shared",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
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
          why, who we share it with, and the rights you have. It covers the Foray
          iOS app, this website, and related services.
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
            We practise data minimisation: the only universally required personal
            data is your <strong className="text-foreground">name</strong>.
            Everything else is collected only when a feature you use needs it,
            for example your account identifier, saved and AI-generated recipes,
            meal plans, grocery lists, shopping history, store preference (chosen
            manually), dietary/allergen settings, subscription status, and (with
            permission) notification tokens.
          </p>
          <p>
            Diagnostics and product analytics are{" "}
            <strong className="text-foreground">opt-in and off by default</strong>{" "}
            in the UK/EU. We do not collect your location. You choose your store
            manually. We do not collect unnecessary demographics or your contacts,
            and we do not perform tracking-based advertising.
          </p>
        </LegalSection>

        <LegalSection title="3. Payments: what we do not collect">
          <p>
            Foray is{" "}
            <strong className="text-foreground">not the merchant of record</strong>{" "}
            for groceries. Grocery payment happens in the retailer/partner
            surface. We do not collect or store your card or payment-card details.
            App subscriptions are billed by Apple via the App Store. The
            online-checkout convenience charge is processed by Stripe through an
            Apple Pay sheet. We receive only transaction status from Stripe, never
            your full card details.
          </p>
        </LegalSection>

        <LegalSection title="4. AI recipe creation and imported social content">
          <p>
            Foray offers four ways to create a recipe, all processed by our AI
            pipeline (&ldquo;the Chef&rdquo;): import from a link; generate from a
            prompt (including via Siri); photo of a dish or written recipe; pantry
            photo of ingredients you have (you confirm before generating; we do
            not build a kitchen inventory). Content you provide is sent to our AI
            provider to produce a structured recipe. We store the result privately
            on your account; for social imports we keep a link back to the original
            and do not republish your imports to other users.
          </p>
          <p>
            AI output may be inaccurate. Always verify ingredients, and never
            rely on it for allergen safety.
          </p>
        </LegalSection>

        <LegalSection title="5. Who we share data with (subprocessors)">
          <p>
            We share the minimum necessary with vetted providers acting on our
            instructions under data-processing agreements:
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
        </LegalSection>

        <LegalSection title="6. International transfers">
          <p>
            Our primary data processing takes place in the EEA (AWS eu-west-1,
            Ireland). Where data is processed outside the UK/EEA, we rely on the
            UK International Data Transfer Agreement / Addendum and/or EU Standard
            Contractual Clauses, plus supplementary measures where appropriate.
          </p>
        </LegalSection>

        <LegalSection title="7. Retention">
          <p>
            We keep your personal data while your account is active. When you
            delete your account, we delete your records, wipe local on-device
            data, and revoke tokens; backup copies are purged within 30 days.
            Diagnostics (if opted in) are retained up to 90 days; analytics up
            to 12 months. Transaction records for the convenience charge are
            retained as required by law (generally 6 years in the UK).
          </p>
        </LegalSection>

        <LegalSection title="8. Your rights">
          <p>
            You can access, export, rectify, and erase your data, and restrict or
            object to certain processing, from in-app Settings or by contacting{" "}
            {LEGAL_ENTITY.privacyEmail}. UK/EU users have rights under UK and EU
            GDPR. US/California residents have rights to know, access, delete,
            and correct. We do not sell or share personal data as those terms are
            defined.
          </p>
        </LegalSection>

        <LegalSection title="9. Children">
          <p>
            Foray is intended for users aged 13 and over. We do not knowingly
            collect personal data from children under 13. Contact{" "}
            {LEGAL_ENTITY.privacyEmail} if you believe a child under 13 has
            provided us data.
          </p>
        </LegalSection>

        <LegalSection title="10. Security">
          <p>
            On-device data is encrypted at rest by iOS Data Protection; auth tokens
            are stored in the iOS Keychain. Network traffic uses TLS; backend
            functions apply least-privilege authorisation and ownership checks.
          </p>
        </LegalSection>

        <LegalSection title="11. Siri, Shortcuts & widgets">
          <p>
            If you use Foray through Siri, Shortcuts, Spotlight, or widgets, your
            spoken request is processed by Apple under Apple&rsquo;s terms; Foray
            receives the resulting structured request and handles it like the
            equivalent in-app action. We don&rsquo;t receive or store your voice
            audio.
          </p>
        </LegalSection>

        <LegalSection title="12. Cookies on this website">
          <p>
            This website sets no marketing or tracking cookies by default. When you
            make a choice in our cookie banner, we store it as{" "}
            <code className="text-foreground">foray-consent</code> (a
            strictly-necessary cookie plus a browser localStorage entry, kept for
            about 6 months). Only if you choose &ldquo;Accept&rdquo; do we load
            Google Analytics. Signing in to the admin area uses strictly-necessary
            authentication cookies.
          </p>
        </LegalSection>

        <LegalSection title="13. Changes & contact">
          <p>
            We may update this policy and will revise the &ldquo;last
            updated&rdquo; date; for material changes we will notify you in-app or
            by email. Questions or requests:{" "}
            <a
              href={`mailto:${LEGAL_ENTITY.privacyEmail}`}
              className="text-foreground underline"
            >
              {LEGAL_ENTITY.privacyEmail}
            </a>{" "}
            · {postalContactLine()} UK/EU users may also contact the ICO or their
            local data protection authority.
          </p>
        </LegalSection>
      </div>
    </div>
  );
}

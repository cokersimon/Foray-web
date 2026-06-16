import type { Metadata } from "next";
import Link from "next/link";
import { DraftBanner } from "@/components/legal/draft-banner";

export const metadata: Metadata = {
  title: "Privacy Policy — Foray",
};

const SUBPROCESSORS: { name: string; purpose: string; data: string }[] = [
  {
    name: "Supabase",
    purpose: "Backend, database, hosting and authentication (account sync, Sign in with Apple + email code).",
    data: "Account, recipes, plans, lists, settings, auth identifier and session metadata.",
  },
  {
    name: "Pepesto",
    purpose: "Grocery pricing and online-checkout handoff to retailers.",
    data: "Cart items and store selection. No Foray-held card data.",
  },
  {
    name: "Stripe",
    purpose: "Processing the online-checkout convenience fee, presented via an Apple Pay sheet.",
    data: "Transaction status only. We never receive or store your full card details.",
  },
  {
    name: "Google (Gemini)",
    purpose: 'Our AI parser ("the Chef") that turns imported recipe links into structured recipes.',
    data: "The recipe content you import (link text / photo). Not used to train models per our agreement.",
  },
  {
    name: "Recraft",
    purpose: "Generating recipe hero imagery in our recipe pipeline.",
    data: "Recipe titles and prompts. No user personal data.",
  },
  {
    name: "Resend",
    purpose: "Sending transactional and waitlist emails (e.g. confirmations, account messages).",
    data: "Your email address and message content.",
  },
  {
    name: "Apple (App Store & APNs)",
    purpose: "Billing premium subscriptions and delivering push notifications you enable.",
    data: "Purchase/entitlement status; device token and notification payload.",
  },
];

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

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 lg:py-32">
      <Link
        href="/"
        className="mb-12 inline-block text-sm text-muted transition-colors hover:text-foreground"
      >
        &larr; Back to home
      </Link>

      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-muted">Last updated: 3 June 2026 · Effective date: [set at publication]</p>

      <div className="mt-10">
        <DraftBanner />
      </div>

      <div className="space-y-6 text-base leading-relaxed text-muted">
        <p>
          This policy explains what personal data Foray (&ldquo;Foray,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us&rdquo;) collects, why, who we share it
          with, and the rights you have. It covers the Foray iOS app, this
          website, and related services. Foray turns social-media recipes into
          meal plans, a deduplicated grocery list, online or in-person checkout,
          and a cook mode.
        </p>

        <Section title="1. Who we are">
          <p>
            The data controller is [LEGAL ENTITY NAME], [REGISTERED ADDRESS, UK].
            For privacy questions, contact [privacy@forayapp.co.uk]. For UK/EU
            users, the relevant supervisory authority is the UK Information
            Commissioner&rsquo;s Office (ICO), and your local EU data protection
            authority for EU residents.
          </p>
        </Section>

        <Section title="2. The data we collect, and why">
          <p>
            We practise data minimisation: the only universally required
            personal data is your <strong className="text-foreground">name</strong>.
            Everything else is collected only when a feature you use needs it —
            for example your account identifier (Apple ID or email), the recipes
            you import, your meal plans and grocery lists, locale and units,
            subscription status, and (with your permission) approximate location
            for finding nearby stores and notification tokens.
          </p>
          <p>
            Diagnostics and product analytics are{" "}
            <strong className="text-foreground">opt-in and off by default</strong>{" "}
            in the UK/EU. We do not collect unnecessary demographics or your
            contacts, and we do not perform tracking-based advertising.
          </p>
        </Section>

        <Section title="3. Payments — what we do not collect">
          <p>
            Foray is <strong className="text-foreground">not the merchant of record</strong>{" "}
            for groceries. Grocery payment happens in the retailer/partner
            surface, and we do not collect or store your card details. App
            subscriptions are billed by Apple via the App Store. The
            online-checkout convenience fee is processed by Stripe through an
            Apple Pay sheet — we receive only the transaction status, never your
            full card details.
          </p>
        </Section>

        <Section title="4. Imported recipe content">
          <p>
            When you paste or share a recipe link or photo, we send that content
            to our AI parser (the Chef) to extract structured facts (ingredients,
            quantities, steps). We store the structured result and a link back to
            the original, and keep your imported text/photo privately as a
            fidelity buffer tied to your account. We do not republish it to other
            users or re-host creators&rsquo; media. AI output may be inaccurate —
            always verify ingredients, especially allergens.
          </p>
        </Section>

        <Section title="5. Who we share data with (subprocessors)">
          <p>
            We share the minimum necessary with vetted providers acting on our
            instructions under data-processing agreements. The current list:
          </p>
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 font-semibold text-foreground">Subprocessor</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Purpose</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Data involved</th>
                </tr>
              </thead>
              <tbody>
                {SUBPROCESSORS.map((sp) => (
                  <tr key={sp.name} className="border-b border-border last:border-0 align-top">
                    <td className="px-4 py-3 font-medium text-foreground">{sp.name}</td>
                    <td className="px-4 py-3">{sp.purpose}</td>
                    <td className="px-4 py-3">{sp.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            We may add or change subprocessors as integrations evolve and will
            keep this list current. Error-tracking (e.g. Sentry) is not yet
            enabled; if we enable it, crash data will exclude names, recipe text,
            and tokens, and this list will be updated first.
          </p>
        </Section>

        <Section title="6. International transfers">
          <p>
            Where data is processed outside the UK/EEA, we rely on appropriate
            safeguards — the UK International Data Transfer Agreement/Addendum
            and/or EU Standard Contractual Clauses — plus supplementary measures.
            We will confirm and document each subprocessor&rsquo;s processing
            region before launch.
          </p>
        </Section>

        <Section title="7. Retention">
          <p>
            We keep your personal data while your account is active. When you{" "}
            <strong className="text-foreground">delete your account</strong> (in
            Settings), we delete your Supabase records, wipe local on-device
            data, and revoke your tokens. Deletion is irreversible, subject to any
            short rollback window and legally required retention (e.g.
            transaction records for the convenience fee). [Confirm windows with
            legal.]
          </p>
        </Section>

        <Section title="8. Your rights">
          <p>
            You can access, export, rectify, and erase your data, and restrict or
            object to certain processing, from in-app Settings or by contacting
            us. UK/EU users have rights under UK and EU GDPR and may complain to
            the ICO or their local DPA. US/California residents have rights to
            know, access, delete, and correct — we do not sell or share personal
            data as those terms are defined.
          </p>
        </Section>

        <Section title="9. Children">
          <p>
            Foray is intended for users aged 13 and over. We do not knowingly
            collect data from children under 13.
          </p>
        </Section>

        <Section title="10. Security">
          <p>
            On-device data is held in a local encrypted database (SQLCipher) and
            auth tokens in the iOS Keychain. Network traffic uses TLS, and backend
            functions apply least-privilege, server-side authorisation and
            ownership checks.
          </p>
        </Section>

        <Section title="11. App Store privacy label">
          <p>
            This policy is kept consistent with Foray&rsquo;s App Store privacy
            label. Where the label and this policy describe the same data, they
            are intended to match; if you spot a discrepancy, contact us.
          </p>
        </Section>

        <Section title="12. Changes & contact">
          <p>
            We may update this policy and will revise the &ldquo;last
            updated&rdquo; date, notifying you in-app or by email for material
            changes. Questions or requests: [privacy@forayapp.co.uk] · [LEGAL
            ENTITY NAME, ADDRESS].
          </p>
        </Section>
      </div>
    </main>
  );
}

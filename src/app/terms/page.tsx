import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — Zentra",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 lg:py-32">
      <Link
        href="/"
        className="mb-12 inline-block text-sm text-muted transition-colors hover:text-foreground"
      >
        &larr; Back to home
      </Link>

      <h1 className="text-4xl font-bold tracking-tight text-foreground">
        Terms &amp; Conditions
      </h1>

      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted">
        <p>
          <strong className="text-foreground">Effective Date:</strong> TBD
        </p>

        <p>
          Welcome to Zentra. By accessing or using our website and mobile
          application, you agree to be bound by these Terms &amp; Conditions.
          Please read them carefully before using the service.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Use of Service
        </h2>
        <p>
          Zentra provides AI-powered fitness, nutrition, and recovery planning
          tools. You must be at least 18 years old to create an account. You
          are responsible for maintaining the confidentiality of your login
          credentials.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Intellectual Property
        </h2>
        <p>
          All content, features, and functionality of the Zentra platform are
          owned by Zentra and are protected by copyright, trade mark, and other
          intellectual property laws.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Limitation of Liability
        </h2>
        <p>
          Zentra is not a medical provider. Our fitness, nutrition, and
          recovery recommendations are for informational purposes only and
          should not replace professional medical advice. Use the service at
          your own risk.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Changes to Terms
        </h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use
          of the service after changes constitutes acceptance of the revised
          terms.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Contact Us
        </h2>
        <p>
          Questions about these terms? Reach us at{" "}
          <span className="text-foreground">legal@zentra.app</span>.
        </p>

        <p className="pt-6 text-sm italic">
          This is a placeholder document and will be replaced with a legally
          reviewed version prior to launch.
        </p>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Zentra",
};

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

      <div className="mt-10 space-y-6 text-base leading-relaxed text-muted">
        <p>
          <strong className="text-foreground">Effective Date:</strong> TBD
        </p>

        <p>
          Zentra (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
          is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, and safeguard your information when you use our
          website and mobile application.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Information We Collect
        </h2>
        <p>
          We may collect personal data you voluntarily provide, such as your
          name, e-mail address, and fitness-related data. We also automatically
          collect usage data including device information, IP address, and
          browsing patterns.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          How We Use Your Information
        </h2>
        <p>
          Your information is used to provide and improve the Zentra service,
          personalise your experience, communicate with you about updates and
          offers, and ensure the security of our platform.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Data Sharing
        </h2>
        <p>
          We do not sell your personal data. We may share data with trusted
          third-party service providers who assist in operating our platform,
          subject to confidentiality obligations.
        </p>

        <h2 className="pt-4 text-xl font-semibold text-foreground">
          Contact Us
        </h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
          <span className="text-foreground">privacy@zentra.app</span>.
        </p>

        <p className="pt-6 text-sm italic">
          This is a placeholder policy and will be replaced with a legally
          reviewed version prior to launch.
        </p>
      </div>
    </main>
  );
}

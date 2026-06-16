"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Supabase Auth sign-in (ADR-019) — replaces Clerk's <SignIn />. Email + password for
 * the allowlisted admin account; admin gate itself is `app_metadata.role === 'admin'`
 * (checked in middleware + Edge Functions), so a non-admin sign-in goes nowhere.
 */
export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsSubmitting(true);
      try {
        const { data, error: signInError } =
          await supabaseBrowser().auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        const role = (data.user?.app_metadata as Record<string, unknown> | undefined)
          ?.role;
        if (role !== "admin") {
          setError("This account does not have admin access.");
          await supabaseBrowser().auth.signOut();
          return;
        }
        router.push("/admin");
        router.refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, router],
  );

  return (
    <div className="dark-theme flex min-h-screen items-center justify-center bg-background text-foreground">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-950 p-8"
      >
        <h1 className="flex items-baseline gap-2 text-lg">
          <Wordmark />
          <span className="text-sm font-medium uppercase tracking-wider text-neutral-500">
            Admin
          </span>
        </h1>
        <p className="mt-1 text-sm text-neutral-400">Sign in to continue.</p>

        {error ? (
          <div
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !email.trim() || !password}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>
    </div>
  );
}

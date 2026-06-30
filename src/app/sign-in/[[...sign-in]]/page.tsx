"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Supabase Auth sign-in (ADR-019) — replaces Clerk's <SignIn />. Email + password for
 * the allowlisted admin account; admin gate itself is `app_metadata.role === 'admin'`
 * (checked in middleware + Edge Functions), so a non-admin sign-in goes nowhere.
 */
export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);

  useEffect(() => {
    const onLocalhost = window.location.hostname === "localhost";
    setIsLocalhost(onLocalhost);

    const queryEmail = searchParams.get("email")?.trim();
    if (queryEmail) setEmail(queryEmail);

    const queryError = searchParams.get("error");
    if (queryError) {
      setError(decodeURIComponent(queryError));
    }

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const hashParams = new URLSearchParams(hash);
    const hashError = hashParams.get("error_description") ?? hashParams.get("error");
    if (hashError) {
      setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
      window.history.replaceState(null, "", window.location.pathname);
    }

    if (searchParams.get("recover") === "1" && queryEmail) {
      setInfo("Tap Forgot password? to email a reset link to forayapp.co.uk.");
    }
  }, [searchParams]);

  const handleForgotPassword = useCallback(async () => {
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }

    if (isLocalhost) {
      window.location.href = `${SITE_URL}/sign-in?email=${encodeURIComponent(trimmed)}&recover=1`;
      return;
    }

    setIsSendingReset(true);
    try {
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not send reset link.");
        return;
      }
      setInfo(
        "Reset link sent — open it once on this device. Links expire after one use.",
      );
    } finally {
      setIsSendingReset(false);
    }
  }, [email, isLocalhost]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setInfo(null);
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
        router.push("/admin/recipes");
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

        {isLocalhost ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Password reset must run on{" "}
            <a href={`${SITE_URL}/sign-in`} className="underline underline-offset-2">
              {SITE_URL.replace("https://", "")}
            </a>{" "}
            — reset links cannot open on localhost from your phone.
          </p>
        ) : null}

        {error ? (
          <div
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {info ? (
          <div
            className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200"
            role="status"
          >
            {info}
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
          type="button"
          onClick={handleForgotPassword}
          disabled={isSendingReset}
          className="mt-3 text-sm text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline disabled:opacity-50"
        >
          {isSendingReset ? "Sending reset link…" : "Forgot password?"}
        </button>

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

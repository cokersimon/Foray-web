"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { SITE_URL } from "@/lib/site";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/wordmark";

type Mode = "sign-in" | "forgot-password";

function formatRecoverError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("over_email_send")) {
    return "Too many reset emails sent — wait about an hour, then try again.";
  }
  return message;
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("sign-in");
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

    if (searchParams.get("mode") === "forgot-password" || searchParams.get("recover") === "1") {
      setMode("forgot-password");
    }

    const queryError = searchParams.get("error");
    if (queryError) {
      setError(decodeURIComponent(queryError));
      setMode("forgot-password");
    }

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : "";
    const hashParams = new URLSearchParams(hash);
    const hashError = hashParams.get("error_description") ?? hashParams.get("error");
    if (hashError) {
      setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
      setMode("forgot-password");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  const sendResetEmail = useCallback(async (trimmed: string) => {
    const response = await fetch("/api/auth/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(formatRecoverError(payload.error ?? "Could not send reset link."));
      return;
    }
    setInfo(
      "Reset link sent — check your inbox and open the link once on this device.",
    );
  }, []);

  const handleForgotPassword = useCallback(async () => {
    setError(null);
    setInfo(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter your email address first.");
      return;
    }

    if (isLocalhost) {
      window.location.href = `${SITE_URL}/sign-in?email=${encodeURIComponent(trimmed)}&mode=forgot-password`;
      return;
    }

    setIsSendingReset(true);
    try {
      await sendResetEmail(trimmed);
    } finally {
      setIsSendingReset(false);
    }
  }, [email, isLocalhost, sendResetEmail]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (mode === "forgot-password") {
        await handleForgotPassword();
        return;
      }

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
    [email, handleForgotPassword, mode, password, router],
  );

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

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

        <div className="mt-4 flex rounded-lg border border-white/10 bg-neutral-900 p-1">
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "sign-in"
                ? "bg-neutral-100 text-neutral-950"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode("forgot-password")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "forgot-password"
                ? "bg-neutral-100 text-neutral-950"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Reset password
          </button>
        </div>

        <p className="mt-3 text-sm text-neutral-400">
          {mode === "sign-in"
            ? "Sign in with your admin email and password."
            : "We’ll email you a link to choose a new password."}
        </p>

        {isLocalhost && mode === "forgot-password" ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Reset links open on{" "}
            <Link href={`${SITE_URL}/sign-in?mode=forgot-password`} className="underline underline-offset-2">
              forayapp.co.uk
            </Link>{" "}
            — you’ll be redirected there when you tap Send reset link.
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

        {mode === "sign-in" ? (
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
        ) : null}

        <button
          type="submit"
          disabled={
            mode === "sign-in"
              ? isSubmitting || !email.trim() || !password
              : isSendingReset || !email.trim()
          }
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mode === "sign-in" ? (
            isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null
          ) : isSendingReset ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {mode === "sign-in"
            ? "Sign in"
            : isSendingReset
              ? "Sending reset link…"
              : "Send reset link"}
        </button>

        {mode === "sign-in" ? (
          <button
            type="button"
            onClick={() => switchMode("forgot-password")}
            className="mt-3 w-full text-sm text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline"
          >
            Forgot your password?
          </button>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className="mt-3 w-full text-sm text-neutral-400 underline-offset-2 hover:text-neutral-200 hover:underline"
          >
            Back to sign in
          </button>
        )}
      </form>
    </div>
  );
}

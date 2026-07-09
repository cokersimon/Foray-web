"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Recovery landing page — after the emailed reset link, the user sets a new password here
 * (`updateUser`) before entering the admin portal.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      const next = encodeURIComponent("/auth/reset-password");
      router.replace(`/auth/callback?next=${next}&code=${encodeURIComponent(code)}`);
      return;
    }

    const supabase = supabaseBrowser();

    const establishSession = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const hashParams = new URLSearchParams(hash);
      const hashError =
        hashParams.get("error_description") ?? hashParams.get("error");
      if (hashError) {
        setError(decodeURIComponent(hashError.replace(/\+/g, " ")));
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (!sessionError) {
          window.history.replaceState(null, "", window.location.pathname);
          setReady(true);
          return;
        }
        setError(sessionError.message);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) setReady(true);
    };

    void establishSession();

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => subscription.subscription.unsubscribe();
  }, [router, searchParams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!ready) {
        setError("Open the reset link from your email. This page needs an active recovery session.");
        return;
      }
      if (password.length < 8) {
        setError("Use at least 8 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      setIsSubmitting(true);
      try {
        const supabase = supabaseBrowser();
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) {
          setError(updateError.message);
          return;
        }
        const { data, error: sessionError } = await supabase.auth.getUser();
        if (sessionError || !data.user) {
          setError("Session expired. Request a new reset link.");
          return;
        }
        const role = (data.user.app_metadata as Record<string, unknown> | undefined)?.role;
        if (role !== "admin") {
          setError("This account does not have admin access.");
          await supabase.auth.signOut();
          return;
        }
        router.push("/admin/recipes");
        router.refresh();
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirm, password, ready, router],
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
        <p className="mt-1 text-sm text-neutral-400">
          {ready
            ? "Choose a new password."
            : "Waiting for your reset link… open the email link once only."}
        </p>

        {error ? (
          <div
            className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
            role="alert"
          >
            {error}
            <Link
              href="/sign-in?mode=forgot-password"
              className="mt-2 block underline underline-offset-2"
            >
              Request a new reset link
            </Link>
          </div>
        ) : null}

        <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={!ready}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
          />
        </label>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={!ready}
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting || !ready || !password || !confirm}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save password
        </button>
      </form>
    </div>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLenis } from "lenis/react";
import { ForayIcon } from "@/components/brand/foray-icon";
import { useWaitlist } from "./waitlist-provider";
import { joinWaitlist } from "@/actions/waitlist";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])';

export function WaitlistModal() {
  const { isOpen, close } = useWaitlist();
  const [email, setEmail] = useState("");
  /** Honeypot — humans never see or fill this; bots that autofill do. */
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const lenis = useLenis();

  const handleClose = useCallback(() => {
    close();
    // Let the exit animation finish before resetting state.
    setTimeout(() => {
      setEmail("");
      setCompany("");
      setStatus("idle");
      setErrorMsg("");
    }, 300);
  }, [close]);

  /**
   * Dialog behaviour while open: lock background scroll (native + Lenis),
   * move focus into the dialog, trap Tab / Shift+Tab, close on Escape, and
   * restore focus to the invoking element on close.
   */
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenis?.stop();

    const raf = requestAnimationFrame(() => emailRef.current?.focus());

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusables = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      lenis?.start();
      previouslyFocused?.focus?.();
    };
  }, [isOpen, lenis, handleClose]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const result = await joinWaitlist(email.trim(), company);

    if (result.success) {
      setStatus("success");
    } else {
      setErrorMsg(result.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" aria-hidden="true" />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-2xl shadow-black/20"
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 rounded-full p-1.5 text-foreground transition-colors hover:bg-foreground/[0.06]"
            >
              <ForayIcon name="close" size="small" />
            </button>

            <div aria-live="polite">
              {status === "success" ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="mb-4 text-4xl" aria-hidden="true">
                    &#10024;
                  </div>
                  <h2 id="waitlist-title" className="text-2xl font-bold text-foreground">
                    You&rsquo;re on the list!
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    We&rsquo;ll email you the moment early access opens. Check
                    your inbox for a confirmation.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-8 rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <h2 id="waitlist-title" className="text-2xl font-bold text-foreground">
                    Join the waitlist
                  </h2>
                  <p className="mt-2 text-base leading-relaxed text-muted">
                    Recipes in, groceries out. Be first in line when Foray
                    opens in the UK.
                  </p>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <label htmlFor="waitlist-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="waitlist-email"
                      ref={emailRef}
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none placeholder:text-muted focus:border-foreground/40 focus:ring-1 focus:ring-foreground/20"
                      style={{ fontSize: "16px" }}
                    />

                    {/* Honeypot: visually hidden and skipped by keyboard/AT. */}
                    <input
                      type="text"
                      name="company"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                    />

                    {status === "error" && (
                      <p className="text-xs text-red-600" role="alert">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="w-full rounded-xl bg-foreground py-3 text-base font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {status === "loading" ? "Joining…" : "Join waitlist"}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-xs leading-relaxed text-muted">
                    We&rsquo;ll only email you about Foray, and you can
                    unsubscribe any time. By joining you agree to our{" "}
                    <Link
                      href="/privacy"
                      className="underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

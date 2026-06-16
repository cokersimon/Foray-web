"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useWaitlist } from "./waitlist-provider";
import { joinWaitlist } from "@/actions/waitlist";

export function WaitlistModal() {
  const { isOpen, close } = useWaitlist();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    const result = await joinWaitlist(email.trim());

    if (result.success) {
      setStatus("success");
    } else {
      setErrorMsg(result.error ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  function handleClose() {
    close();
    setTimeout(() => {
      setEmail("");
      setStatus("idle");
      setErrorMsg("");
    }, 300);
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-3xl border border-black bg-white p-8 shadow-2xl"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-4 right-4 rounded-full p-1.5 text-black transition-colors hover:bg-neutral-100"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>

            {status === "success" ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="mb-4 text-4xl text-black">&#10024;</div>
                <h2 className="text-2xl font-bold text-black">
                  You&rsquo;re on the list!
                </h2>
                <p className="mt-3 text-base leading-relaxed text-black">
                  We&rsquo;ll send you an invite as soon as Foray is ready.
                  Check your inbox for a confirmation.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-8 rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-black">
                  Join the Waitlist
                </h2>
                <p className="mt-2 text-base leading-relaxed text-black">
                  Be the first to get access to train smarter and live a healthier
                  life.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your e-mail address."
                    className="w-full rounded-xl border border-black bg-neutral-50 px-4 py-3 text-base text-black outline-none placeholder:text-neutral-500 focus:border-black focus:ring-1 focus:ring-black/20"
                    style={{ fontSize: "16px" }}
                  />

                  {status === "error" && (
                    <p className="text-xs text-red-600">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-xl bg-black py-3 text-base font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {status === "loading" ? "Joining..." : "Join Waitlist"}
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-black">
                  Unsubscribe anytime.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

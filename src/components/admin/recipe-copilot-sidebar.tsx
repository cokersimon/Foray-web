"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabaseSession } from "@/components/providers";
import { chefAdmin } from "@/lib/chef-api";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquare,
  Send,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/cn";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

interface RecipeCopilotSidebarProps {
  stagingId: string | null;
  className?: string;
}

export function RecipeCopilotSidebar({
  stagingId,
  className,
}: RecipeCopilotSidebarProps) {
  const { isAuthenticated } = useSupabaseSession();
  const [copilotInstructions, setCopilotInstructions] = useState<string | null>(
    null,
  );
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [instructionDraft, setInstructionDraft] = useState("");
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [instructionSaveError, setInstructionSaveError] = useState<string | null>(
    null,
  );
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setInput("");
    setSettingsOpen(false);
    setInstructionSaveError(null);
  }, [stagingId]);

  useEffect(() => {
    if (!settingsOpen || !isAuthenticated) return;
    if (copilotInstructions !== null) {
      setInstructionDraft(copilotInstructions);
      setInstructionSaveError(null);
      return;
    }
    let cancelled = false;
    void chefAdmin<{ copilot: { instructions?: string } | null }>("copilot.get")
      .then(({ copilot }) => {
        if (cancelled) return;
        const instructions = String(copilot?.instructions ?? "");
        setCopilotInstructions(instructions);
        setInstructionDraft(instructions);
        setInstructionSaveError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setInstructionSaveError(
          e instanceof Error ? e.message : "Failed to load copilot rules",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [settingsOpen, isAuthenticated, copilotInstructions]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const handleSend = useCallback(async () => {
    if (!stagingId || !isAuthenticated || sending) return;
    const text = input.trim();
    if (!text) return;

    setInput("");
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
    };
    setMessages((m) => [...m, userMsg]);
    setSending(true);
    try {
      const result = await chefAdmin<{ reply: string }>("copilot.chat", {
        stagingId,
        message: text,
      });
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: result.reply,
        },
      ]);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Copilot request failed.";
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: "assistant",
          text: `Error: ${msg}`,
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [stagingId, isAuthenticated, sending, input]);

  const handleSaveInstructions = useCallback(async () => {
    setInstructionSaveError(null);
    if (!isAuthenticated) {
      setInstructionSaveError("Sign in again before saving copilot rules.");
      return;
    }
    setSavingInstructions(true);
    try {
      await chefAdmin("copilot.set", { instructions: instructionDraft });
      setCopilotInstructions(instructionDraft);
    } catch (e: unknown) {
      setInstructionSaveError(
        e instanceof Error ? e.message : "Failed to save copilot rules",
      );
    } finally {
      setSavingInstructions(false);
    }
  }, [isAuthenticated, instructionDraft]);

  if (!stagingId) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex shrink-0 border-l border-neutral-200 bg-white transition-[width] duration-200 ease-out",
        open ? "w-[min(22rem,40vw)]" : "w-11",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-11 shrink-0 flex-col items-center border-r border-neutral-100 bg-neutral-50 py-3 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        title={open ? "Collapse copilot" : "Expand copilot"}
      >
        {open ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
        <MessageSquare className="mt-3 h-4 w-4" />
      </button>

      {open && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="border-b border-neutral-100 px-3 py-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-800">
              Recipe copilot
            </h3>
            <p className="mt-0.5 text-[11px] leading-snug text-neutral-500">
              Ask for fixes; changes apply to staging and refresh macros.
            </p>
          </div>

          <div className="scrollbar-hide min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2">
            {messages.length === 0 && (
              <p className="text-xs text-neutral-500">
                Example: &ldquo;Strip &apos;chopped&apos; from onion
                ingredients&rdquo; or &ldquo;Rewrite the cooking guide: set
                recipeData.cookingGuide to …&rdquo;
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-lg px-2.5 py-2 text-xs leading-relaxed",
                  m.role === "user"
                    ? "ml-4 bg-neutral-900 text-neutral-50"
                    : "mr-2 border border-neutral-100 bg-neutral-50 text-neutral-800",
                )}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {settingsOpen && (
            <div className="border-t border-amber-200/70 bg-gradient-to-b from-amber-50/90 to-amber-50/50 px-3 py-2.5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/90">
                    Admin override
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-amber-900/70">
                    Copilot rules for every reply (plus JSON patch rules). When
                    editing procedure, the model should patch{" "}
                    <span className="font-mono text-[9px]">recipeData.cookingGuide</span>{" "}
                    — not the legacy <span className="font-mono text-[9px]">steps</span>{" "}
                    key.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-amber-900/70 hover:bg-amber-100/80 hover:text-amber-950"
                >
                  Close
                </button>
              </div>
              {copilotInstructions === null ? (
                <div className="flex items-center gap-2 py-6 text-xs text-amber-900/60">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading copilot rules…
                </div>
              ) : (
                <>
                  <textarea
                    value={instructionDraft}
                    onChange={(e) => setInstructionDraft(e.target.value)}
                    rows={6}
                    disabled={savingInstructions}
                    spellCheck={false}
                    className="w-full resize-y rounded-md border border-amber-200/90 bg-white/90 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:border-amber-400 focus:outline-none disabled:opacity-50"
                    aria-label="Copilot rules (personality and patch hints)"
                  />
                  {instructionSaveError && (
                    <p className="mt-1.5 text-[10px] text-red-700">
                      {instructionSaveError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleSaveInstructions()}
                    disabled={
                      savingInstructions ||
                      !instructionDraft.trim() ||
                      instructionDraft.trim() === copilotInstructions.trim()
                    }
                    className="mt-2 w-full rounded-md bg-amber-950 px-2 py-1.5 text-xs font-medium text-amber-50 transition-colors hover:bg-amber-900 disabled:opacity-40"
                  >
                    {savingInstructions ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving…
                      </span>
                    ) : (
                      "Save copilot rules"
                    )}
                  </button>
                </>
              )}
            </div>
          )}

          <div className="border-t border-neutral-100 p-2">
            <div className="flex gap-1.5">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Message…"
                rows={2}
                disabled={sending}
                className="min-h-0 flex-1 resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-xs text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none disabled:opacity-50"
              />
              <div className="flex shrink-0 flex-col gap-1 self-end">
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={sending || !input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900 text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
                  title="Send"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSettingsOpen((o) => {
                      const next = !o;
                      if (!next) setInstructionSaveError(null);
                      return next;
                    })
                  }
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
                    settingsOpen
                      ? "border-amber-300 bg-amber-50 text-amber-950"
                      : "border-neutral-200 bg-white",
                  )}
                  title={
                    settingsOpen
                      ? "Hide copilot rules"
                      : "Copilot rules (cookingGuide-aware)"
                  }
                  aria-expanded={settingsOpen}
                  aria-label="Copilot rules (cookingGuide-aware)"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

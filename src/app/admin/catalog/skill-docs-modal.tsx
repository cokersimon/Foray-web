"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { cn } from "@/lib/cn";
import type { SkillDocs } from "./types";

/**
 * Skill-doc viewer (plan C4) — tap to read the compiled matcher + auditor procedures the agents
 * follow, version-stamped. Read-only v1; the canonical markdown lives in docs/05-architecture/.
 */
export function SkillDocsModal({ onClose }: { onClose: () => void }) {
  const [docs, setDocs] = useState<SkillDocs | null>(null);
  const [tab, setTab] = useState<"matcher" | "auditor">("matcher");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    chefAdmin<SkillDocs>("catalog.skillDocs.get")
      .then((d) => !cancelled && setDocs(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load"));
    return () => {
      cancelled = true;
    };
  }, []);

  const active = docs?.[tab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="text-base font-semibold text-neutral-900">Semantic-matching skill</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-neutral-200 px-6 py-3">
          {(["matcher", "auditor"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                tab === t ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100",
              )}
            >
              {t}
              {docs ? <span className="ml-2 text-xs opacity-60">{docs[t].version}</span> : null}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
          ) : active ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-700">{active.text}</pre>
          ) : (
            <p className="text-sm text-neutral-400">Loading…</p>
          )}
        </div>
      </div>
    </div>
  );
}

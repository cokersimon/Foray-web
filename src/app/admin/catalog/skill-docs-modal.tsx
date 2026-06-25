"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { cn } from "@/lib/cn";
import type { SkillDocs } from "./types";

type SkillManifest = {
  matcher: { version: string; path: string };
  auditor: { version: string; path: string };
};

async function loadBundledSkillDocs(): Promise<SkillDocs> {
  const manifest = (await fetch("/admin/skill-docs/manifest.json").then((r) => {
    if (!r.ok) throw new Error("manifest missing");
    return r.json();
  })) as SkillManifest;

  const [matcherText, auditorText] = await Promise.all([
    fetch(manifest.matcher.path).then((r) => {
      if (!r.ok) throw new Error("matcher doc missing");
      return r.text();
    }),
    fetch(manifest.auditor.path).then((r) => {
      if (!r.ok) throw new Error("auditor doc missing");
      return r.text();
    }),
  ]);

  return {
    matcher: { version: manifest.matcher.version, text: matcherText },
    auditor: { version: manifest.auditor.version, text: auditorText },
  };
}

/**
 * Skill-doc viewer (plan C4) — tap to read the matcher + auditor procedures the agents follow,
 * version-stamped. Bundled markdown in public/admin/skill-docs/ works offline from Supabase; falls
 * back to chef-admin when the Edge function is deployed.
 */
export function SkillDocsModal({ onClose }: { onClose: () => void }) {
  const [docs, setDocs] = useState<SkillDocs | null>(null);
  const [tab, setTab] = useState<"matcher" | "auditor">("matcher");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"bundled" | "api" | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const bundled = await loadBundledSkillDocs();
        if (cancelled) return;
        setDocs(bundled);
        setSource("bundled");
      } catch {
        try {
          const api = await chefAdmin<SkillDocs>("catalog.skillDocs.get");
          if (cancelled) return;
          setDocs(api);
          setSource("api");
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Failed to load skill docs");
          }
        }
      }
    })();

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
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Semantic-matching skill</h2>
            {source ? (
              <p className="mt-0.5 text-xs text-neutral-400">
                {source === "bundled" ? "Bundled markdown (docs/05-architecture mirror)" : "Live from chef-admin"}
              </p>
            ) : null}
          </div>
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

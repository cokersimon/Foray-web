"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { chefAdmin } from "@/lib/chef-api";

/**
 * Manual ingredient match modal (ADR-019) — matches against the curated Foray
 * ingredient catalog only. No FatSecret fallback and no minting: an unmatched line
 * stays unmatched (and blocks publish) until it is matched here or the catalog grows.
 */

type CatalogCandidate = {
  ingredientId: string;
  slug: string | null;
  name: string;
  score: number;
  macrosPer100g: { kcal?: number; protein?: number; carbs?: number; fat?: number } | null;
};

export interface ManualMatchModalProps {
  open: boolean;
  onClose: () => void;
  onApplied?: () => void | Promise<void>;
  stagingId: string;
  ingredientIndex: number;
  initialQuery?: string | null;
}

const EM_DASH = "—";

function formatMacro(n: number | null | undefined, decimals: number): string {
  if (n == null || !Number.isFinite(n)) return EM_DASH;
  if (decimals <= 0) return String(Math.round(n));
  const pow = 10 ** decimals;
  return String(Math.round(n * pow) / pow);
}

function Per100MacroBadges({ candidate }: { candidate: CatalogCandidate }) {
  const macros = candidate.macrosPer100g;
  if (!macros) {
    return (
      <p className="mt-1.5 text-[10px] text-neutral-600">
        No per-100g macros available — pending backfill
      </p>
    );
  }
  return (
    <div className="mt-1.5 flex flex-wrap gap-1" aria-label="Per 100 grams">
      <span className="rounded-md bg-orange-500/20 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-orange-100/95">
        Cal {formatMacro(macros.kcal, 0)}
      </span>
      <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-emerald-100/90">
        P {formatMacro(macros.protein, 1)}g
      </span>
      <span className="rounded-md bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-sky-100/90">
        C {formatMacro(macros.carbs, 1)}g
      </span>
      <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-amber-100/90">
        F {formatMacro(macros.fat, 1)}g
      </span>
      <span className="self-center text-[8px] uppercase tracking-wide text-neutral-600">
        /100g
      </span>
    </div>
  );
}

export function ManualMatchModal({
  open,
  onClose,
  onApplied,
  stagingId,
  ingredientIndex,
  initialQuery,
}: ManualMatchModalProps) {
  const safeInitialQuery = useMemo(
    () => (typeof initialQuery === "string" ? initialQuery : ""),
    [initialQuery],
  );

  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<CatalogCandidate[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSearchInput(safeInitialQuery.trim());
    setResults([]);
    setSearchError(null);
    setApplyingId(null);
  }, [open, safeInitialQuery]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = typeof q === "string" ? q.trim() : "";
    if (!trimmed) {
      setSearchError("Enter a search term");
      setResults([]);
      return;
    }
    setIsSearching(true);
    setSearchError(null);
    try {
      const { candidates } = await chefAdmin<{ candidates: CatalogCandidate[] }>(
        "ingredients.search",
        { query: trimmed },
      );
      setResults(Array.isArray(candidates) ? candidates : []);
    } catch (e) {
      setResults([]);
      setSearchError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const q = safeInitialQuery.trim();
    if (!q) return;
    void runSearch(q);
  }, [open, safeInitialQuery, runSearch]);

  const handleApply = useCallback(
    async (candidate: CatalogCandidate) => {
      setApplyingId(candidate.ingredientId);
      setSearchError(null);
      try {
        await chefAdmin("staging.manualMatch", {
          stagingId,
          ingredientIndex,
          ingredientId: candidate.ingredientId,
        });
        await onApplied?.();
        onClose();
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : "Could not apply match");
      } finally {
        setApplyingId(null);
      }
    },
    [stagingId, ingredientIndex, onApplied, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-match-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[min(32rem,85vh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#141414] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <h2 id="manual-match-title" className="text-sm font-semibold">
              Manual ingredient match
            </h2>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              Ingredient #{ingredientIndex + 1} — matches against the curated Foray
              catalog. Unmatched lines block publish.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="border-b border-white/10 p-3">
          <div className="flex gap-2">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value ?? "")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void runSearch(searchInput);
                }
              }}
              placeholder="Search the ingredient catalog…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-emerald-500/40 placeholder:text-neutral-600 focus:border-emerald-500/50 focus:ring-2"
            />
            <button
              type="button"
              disabled={isSearching}
              onClick={() => void runSearch(searchInput)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Search className="h-4 w-4" aria-hidden />
              )}
              Search
            </button>
          </div>
          {searchError ? (
            <p className="mt-2 text-xs text-red-400" role="alert">
              {searchError}
            </p>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {isSearching && results.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Searching…
            </div>
          ) : results.length === 0 ? (
            <p className="py-10 text-center text-xs text-neutral-500">
              No results yet. Adjust the query and search.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((candidate) => {
                const busy = applyingId === candidate.ingredientId;
                return (
                  <li key={candidate.ingredientId}>
                    <button
                      type="button"
                      disabled={busy || applyingId != null}
                      onClick={() => void handleApply(candidate)}
                      className={cn(
                        "w-full rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-2.5 text-left transition-colors hover:border-emerald-400/60 hover:bg-emerald-950/35 disabled:cursor-not-allowed disabled:opacity-60",
                        busy && "border-emerald-500/50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="min-w-0 text-sm font-medium text-neutral-100">
                              {candidate.name}
                            </p>
                            <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-200">
                              Foray catalog
                            </span>
                          </div>
                          <Per100MacroBadges candidate={candidate} />
                        </div>
                        <div
                          className="max-w-[9rem] shrink-0 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-right font-mono text-[10px] leading-tight text-emerald-100"
                          title={candidate.slug ?? candidate.ingredientId}
                        >
                          <div className="font-semibold uppercase tracking-wide">
                            {Math.round(candidate.score * 100)}%
                          </div>
                          <div className="truncate">
                            {candidate.slug ?? candidate.ingredientId.slice(0, 8)}
                          </div>
                        </div>
                        {busy ? (
                          <Loader2
                            className="h-4 w-4 shrink-0 animate-spin text-emerald-400"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

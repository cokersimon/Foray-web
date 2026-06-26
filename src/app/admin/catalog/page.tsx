"use client";

import { useState } from "react";
import { BookOpen, Check, Pencil, Play, RefreshCw, Sparkles } from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";
import {
  AISLE_OPTIONS,
  type CatalogListResponse,
  type CatalogRunStats,
  type CatalogSkuRow,
  fmtPence,
  type SkuEdit,
  STORES,
  type StoreDomain,
  TIER_OPTIONS,
} from "./types";
import { SkuDetailDrawer } from "./sku-detail-drawer";
import { SkillDocsModal } from "./skill-docs-modal";

const PAGE = 100;

export default function CatalogPage() {
  const [store, setStore] = useState<StoreDomain>(STORES[0].domain);
  const [aisle, setAisle] = useState<string>("");
  const [band, setBand] = useState<string>("");
  const [tagged, setTagged] = useState<string>("");
  const [pilotOnly, setPilotOnly] = useState(false);
  const [batchSize, setBatchSize] = useState(50);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<CatalogSkuRow | null>(null);
  const [showSkill, setShowSkill] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Inline manual edits, keyed by SKU id. Only changed fields are stored; a Save pass persists
  // them via catalog.updateSku. `editingName` holds the row whose semantic field is open for text edit.
  const [edits, setEdits] = useState<Record<string, SkuEdit>>({});
  const [editingName, setEditingName] = useState<string | null>(null);
  const dirtyCount = Object.keys(edits).length;

  function setEdit(id: string, field: keyof SkuEdit, value: string, original: string) {
    setEdits((prev) => {
      const next = { ...prev };
      const row = { ...(next[id] ?? {}) };
      // Drop the field if the user reverted it to the original value.
      if (value === original) delete row[field];
      else row[field] = value;
      if (Object.keys(row).length === 0) delete next[id];
      else next[id] = row;
      return next;
    });
  }

  async function saveEdits() {
    const entries = Object.entries(edits);
    if (entries.length === 0) return;
    setBusy(`Saving ${entries.length} change${entries.length === 1 ? "" : "s"}`);
    setToast(null);
    let saved = 0;
    try {
      for (const [skuId, patch] of entries) {
        await chefAdmin("catalog.updateSku", { skuId, ...patch });
        saved++;
      }
      setEdits({});
      setEditingName(null);
      setToast(`Saved ${saved} change${saved === 1 ? "" : "s"}`);
    } catch (e) {
      setToast(`Saved ${saved}/${entries.length}; ${e instanceof Error ? e.message : "save failed"}`);
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const stats = useChefQuery<CatalogRunStats>("catalog.runStats", { storeDomain: store }, { pollMs: 15000 });
  const list = useChefQuery<CatalogListResponse>("catalog.list", {
    storeDomain: store,
    aisle: aisle || undefined,
    matchBand: band || undefined,
    tagged: tagged || undefined,
    pilotOnly: pilotOnly || undefined,
    search: search || undefined,
    limit: PAGE,
    offset,
  });

  const refresh = () => {
    stats.refetch();
    list.refetch();
  };

  // Drive a batch-bounded pipeline action to completion. The Edge function is resumable — it only
  // touches still-pending SKUs — so each call continues where the last left off and never restarts.
  // We deliberately request a SMALL unit of work per call (`extraArgs`) so each request returns well
  // inside the Edge wall-clock limit, then auto-continue. A timed-out / failed call is retried (the
  // committed batch persists), so a transient gateway timeout never aborts the whole run.
  async function runToCompletion(action: string, label: string, extraArgs: Record<string, unknown> = {}) {
    setBusy(label);
    setToast(null);
    let consecutiveErrors = 0;
    try {
      for (let i = 0; i < 2000; i++) {
        let r: { remaining?: number; status?: string };
        try {
          r = await chefAdmin<{ remaining?: number; status?: string }>(action, {
            storeDomain: store,
            pilotOnly: pilotOnly || undefined,
            ...extraArgs,
          });
          consecutiveErrors = 0;
        } catch (e) {
          consecutiveErrors++;
          if (consecutiveErrors >= 6) throw e;
          setBusy(`${label} · retrying (${consecutiveErrors}/6)`);
          await new Promise((res) => setTimeout(res, 2500));
          refresh();
          continue;
        }
        refresh();
        const remaining = r.remaining ?? 0;
        setBusy(remaining > 0 ? `${label} · ${remaining} remaining` : label);
        if (remaining === 0 || r.status === "complete") break;
      }
      setToast(`${label} complete`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function runOnce(action: string, label: string, args: Record<string, unknown> = {}) {
    setBusy(label);
    setToast(null);
    try {
      const r = await chefAdmin<Record<string, unknown>>(action, { storeDomain: store, ...args });
      setToast(`${label}: ${JSON.stringify(r).slice(0, 160)}`);
    } catch (e) {
      setToast(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setBusy(null);
      refresh();
    }
  }

  const counts = stats.data?.counts;
  const latestRun = stats.data?.runs?.[0];

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Catalogue</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Review the semantic matching for each supermarket — every SKU with its thumbnail, price,
            date, the matcher&rsquo;s semantic name + tier, and the auditor&rsquo;s verdict. Run the
            pilot, inspect the work, then scale to the full store.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {dirtyCount > 0 ? (
            <button
              type="button"
              disabled={!!busy}
              onClick={saveEdits}
              className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
            >
              <Check className="h-4 w-4" /> Save {dirtyCount} change{dirtyCount === 1 ? "" : "s"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowSkill(true)}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <BookOpen className="h-4 w-4" /> Skill docs
          </button>
          <button
            type="button"
            onClick={refresh}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Store tabs */}
      <div className="mt-6 flex gap-2">
        {STORES.map((s) => (
          <button
            key={s.domain}
            type="button"
            onClick={() => {
              setStore(s.domain);
              setOffset(0);
            }}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              store === s.domain
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Run status header */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="SKUs" value={counts?.total ?? "—"} />
        <StatCard label="Aisle frozen" value={counts ? `${counts.aisleFrozen}/${counts.total}` : "—"} />
        <StatCard label="Matched" value={counts ? `${counts.matched}/${counts.total}` : "—"} />
        <StatCard label="Pilot" value={counts?.pilot ?? "—"} />
        <StatCard label="Low consensus" value={counts?.lowConsensus ?? "—"} tone={counts && counts.lowConsensus > 0 ? "warn" : "default"} />
        <StatCard
          label="Run status"
          value={latestRun?.status ?? "none"}
          tone={latestRun?.status === "needs_review" ? "warn" : "default"}
          sub={latestRun ? `${latestRun.scope} · skill ${latestRun.skillVersion ?? "—"}` : undefined}
        />
      </div>

      {/* Pipeline controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" disabled={!!busy} onClick={() => runOnce("catalog.pilot.select", "Select pilot", { perAisle: 8 })} className={actionBtn}>
          <Sparkles className="h-4 w-4" /> Select pilot (~8/aisle)
        </button>
        <button type="button" disabled={!!busy} onClick={() => runToCompletion("catalog.freezeAisles", "Freeze aisles", { maxBatches: 1 })} className={actionBtn}>
          <Play className="h-4 w-4" /> A0 · Freeze aisles
        </button>
        <button type="button" disabled={!!busy} onClick={() => runOnce("catalog.match", "Match one batch", { pilotOnly: pilotOnly || undefined, batchSize })} className={actionBtn}>
          <Play className="h-4 w-4" /> A1–A4 · Match one batch
        </button>
        <button type="button" disabled={!!busy} onClick={() => runToCompletion("catalog.match", "Match (all)", { batchSize })} className={actionBtn}>
          <Play className="h-4 w-4" /> Match all
        </button>
        <button type="button" disabled={!!busy} onClick={() => { if (confirm(`Wipe semantic + aisle output for ${pilotOnly ? "the pilot" : "the WHOLE store"} so it re-runs under the current skill version?`)) runOnce("catalog.reset", "Reset", { scope: "both", pilotOnly: pilotOnly || undefined }); }} className={actionBtn}>
          <RefreshCw className="h-4 w-4" /> Reset / re-run
        </button>
        <button type="button" disabled={!!busy} onClick={() => runOnce("catalog.golden.run", "Golden set")} className={actionBtn}>
          Golden tripwire
        </button>
        <label className="ml-2 flex items-center gap-2 text-sm text-neutral-600">
          Batch
          <input
            type="number"
            min={10}
            max={500}
            step={10}
            value={batchSize}
            onChange={(e) => setBatchSize(Math.min(500, Math.max(10, Number(e.target.value) || 50)))}
            className="w-20 rounded-md border border-neutral-200 px-2 py-1 text-sm"
          />
        </label>
        <label className="ml-2 flex items-center gap-2 text-sm text-neutral-600">
          <input type="checkbox" checked={pilotOnly} onChange={(e) => { setPilotOnly(e.target.checked); setOffset(0); }} />
          Pilot only
        </label>
        {busy ? <span className="text-sm text-neutral-500">{busy}…</span> : null}
      </div>

      {toast ? (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">{toast}</div>
      ) : null}

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Select value={aisle} onChange={(v) => { setAisle(v); setOffset(0); }} label="All aisles" options={AISLE_OPTIONS} />
        <Select value={band} onChange={(v) => { setBand(v); setOffset(0); }} label="All bands" options={["high", "medium", "unmatched"]} />
        <Select value={tagged} onChange={(v) => { setTagged(v); setOffset(0); }} label="Tagged + untagged" options={[["tagged", "Tagged"], ["untagged", "Untagged"]]} />
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          placeholder="Search name / semantic / handle"
          className="min-w-56 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>

      {/* SKU list */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Semantic</th>
              <th className="px-4 py-3 font-medium">Aisle</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Audit</th>
            </tr>
          </thead>
          <tbody>
            {list.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">Loading…</td></tr>
            ) : (list.data?.skus.length ?? 0) === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">No SKUs match.</td></tr>
            ) : (
              list.data!.skus.map((row) => {
                const e = edits[row.id] ?? {};
                const semVal = e.semanticName ?? row.semanticName ?? "";
                const aisleVal = e.aisle ?? row.aisle ?? "";
                const tierVal = e.budgetTier ?? row.budgetTier ?? "";
                const rowDirty = !!edits[row.id];
                const isEditingName = editingName === row.id;
                return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-neutral-100 transition-colors hover:bg-neutral-50",
                    rowDirty ? "bg-amber-50/60" : null,
                  )}
                >
                  <td className="cursor-pointer px-4 py-2.5" onClick={() => setSelected(row)}>
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.imageUrl} alt="" className="h-9 w-9 rounded-md object-contain ring-1 ring-neutral-100" />
                    ) : <div className="h-9 w-9 rounded-md bg-neutral-100" />}
                  </td>
                  <td className="cursor-pointer px-4 py-2.5" onClick={() => setSelected(row)}>
                    <div className="max-w-xs truncate text-neutral-800">{row.rawName}</div>
                    <div className="text-xs text-neutral-400">{row.quantityStr ?? ""} · {row.skuHandle ?? ""}</div>
                  </td>
                  {/* Semantic — pencil opens an inline text editor */}
                  <td className="px-4 py-2.5">
                    {isEditingName ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          value={semVal}
                          onChange={(ev) => setEdit(row.id, "semanticName", ev.target.value, row.semanticName ?? "")}
                          onKeyDown={(ev) => { if (ev.key === "Enter") setEditingName(null); if (ev.key === "Escape") { setEdit(row.id, "semanticName", row.semanticName ?? "", row.semanticName ?? ""); setEditingName(null); } }}
                          className="w-44 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                        />
                        <button type="button" onClick={() => setEditingName(null)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50" aria-label="Done">
                          <Check className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="group flex items-center gap-1.5">
                        {semVal ? (
                          <span className={cn("text-neutral-700", e.semanticName ? "font-medium text-amber-700" : null)}>{semVal}</span>
                        ) : (
                          <span className="text-xs text-neutral-400">untagged</span>
                        )}
                        <button type="button" onClick={() => setEditingName(row.id)} className="rounded p-1 text-neutral-300 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100" aria-label="Edit semantic name">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {row.variant ? <div className="text-xs text-neutral-400">variant: {row.variant}</div> : null}
                  </td>
                  {/* Aisle — dropdown pre-populated with the current aisle */}
                  <td className="px-4 py-2.5">
                    <select
                      value={aisleVal}
                      onChange={(ev) => setEdit(row.id, "aisle", ev.target.value, row.aisle ?? "")}
                      className={cn(
                        "max-w-[12rem] rounded-md border px-2 py-1 text-sm",
                        e.aisle ? "border-amber-400 bg-amber-50 text-amber-800" : "border-neutral-200 text-neutral-600",
                      )}
                    >
                      <option value="">—</option>
                      {AISLE_OPTIONS.map(([slug, label]) => (
                        <option key={slug} value={slug}>{label}</option>
                      ))}
                    </select>
                    {row.aisleConsensus && row.aisleConsensus !== "agreed" ? (
                      <div className={cn("mt-0.5 text-xs", row.aisleConsensus === "low_consensus" ? "text-amber-600" : "text-neutral-400")}>{row.aisleConsensus}</div>
                    ) : null}
                  </td>
                  {/* Tier — dropdown (value/mid/premium) */}
                  <td className="px-4 py-2.5">
                    <select
                      value={tierVal}
                      onChange={(ev) => setEdit(row.id, "budgetTier", ev.target.value, row.budgetTier ?? "")}
                      className={cn(
                        "rounded-md border px-2 py-1 text-sm capitalize",
                        e.budgetTier ? "border-amber-400 bg-amber-50 text-amber-800" : "border-neutral-200 text-neutral-600",
                      )}
                    >
                      <option value="">—</option>
                      {TIER_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {row.tierContested ? <div className="mt-0.5 text-xs text-amber-600">contested</div> : null}
                  </td>
                  <td className="cursor-pointer px-4 py-2.5 font-mono text-xs text-neutral-700" onClick={() => setSelected(row)}>{fmtPence(row.currentPrice, row.currency ?? "GBP")}</td>
                  <td className="cursor-pointer px-4 py-2.5" onClick={() => setSelected(row)}>
                    {row.matchBand ? <Badge tone={bandTone(row.matchBand)}>{row.matchBand}</Badge> : null}
                    {row.resolutionState === "auto_resolved_low_consensus" ? <div className="text-xs text-amber-600">auto-resolved</div> : null}
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {list.data && list.data.total > PAGE ? (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>{offset + 1}–{Math.min(offset + PAGE, list.data.total)} of {list.data.total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40">Prev</button>
            <button type="button" disabled={offset + PAGE >= list.data.total} onClick={() => setOffset(offset + PAGE)} className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      ) : null}

      {selected ? <SkuDetailDrawer sku={selected} onClose={() => setSelected(null)} /> : null}
      {showSkill ? <SkillDocsModal onClose={() => setShowSkill(false)} /> : null}
    </div>
  );
}

const actionBtn = "flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-40";

function StatCard({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: "default" | "warn" }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">{label}</div>
      <div className={cn("mt-1 text-lg font-bold", tone === "warn" ? "text-amber-600" : "text-neutral-900")}>{value}</div>
      {sub ? <div className="text-[10px] text-neutral-400">{sub}</div> : null}
    </div>
  );
}

function Select({ value, onChange, label, options }: { value: string; onChange: (v: string) => void; label: string; options: readonly (string | [string, string])[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700">
      <option value="">{label}</option>
      {options.map((o) => {
        const [val, lbl] = Array.isArray(o) ? o : [o, o];
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", tone)}>{children}</span>;
}

function bandTone(b: string): string {
  return b === "high" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : b === "medium" ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-neutral-200 bg-neutral-100 text-neutral-500";
}

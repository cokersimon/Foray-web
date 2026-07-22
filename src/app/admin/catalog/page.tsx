"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Check,
  CloudDownload,
  Info,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";
import {
  AISLE_OPTIONS,
  type CatalogRefreshRun,
  type CatalogRefreshRunsResponse,
  type CatalogSnapshotResponse,
  type CatalogSnapshotRow,
  fmtPence,
  type SkuEdit,
  type SnapshotBucket,
  STORES,
  type StoreDomain,
  TIER_OPTIONS,
} from "./types";
import { SkuDetailDrawer } from "./sku-detail-drawer";
import { SkillDocsModal } from "./skill-docs-modal";

const PAGE = 100;

const BUCKET_TABS: ReadonlyArray<[string, string]> = [
  ["active", "Active"],
  ["matched", "Matched"],
  ["new", "New"],
  ["historic", "Historic"],
  ["", "All"],
];

const IN_FLIGHT: ReadonlySet<CatalogRefreshRun["status"]> = new Set([
  "fetching",
  "imported",
  "diffing",
]);

export default function CatalogPage() {
  const [store, setStore] = useState<StoreDomain>(STORES[0].domain);
  const [aisle, setAisle] = useState<string>("");
  const [bucket, setBucket] = useState<string>("active");
  const [runId, setRunId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<CatalogSnapshotRow | null>(null);
  const [showSkill, setShowSkill] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, SkuEdit>>({});
  const [editingName, setEditingName] = useState<string | null>(null);
  const dirtyCount = Object.keys(edits).length;

  function setEdit(id: string, field: keyof SkuEdit, value: string, original: string) {
    setEdits((prev) => {
      const next = { ...prev };
      const row = { ...(next[id] ?? {}) };
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

  const runsQuery = useChefQuery<CatalogRefreshRunsResponse>(
    "catalog.refresh.runs",
    { storeDomain: store },
    { pollMs: 4000 },
  );
  const credits = useChefQuery<{
    creditsRemaining: number | null;
    currency: string;
    checkedAt: number;
    error?: string | null;
  }>("pepesto.credits", {}, { pollMs: 45000 });
  const snapshot = useChefQuery<CatalogSnapshotResponse>("catalog.snapshot", {
    storeDomain: store,
    runId: runId || undefined,
    bucket: bucket || undefined,
    aisle: aisle || undefined,
    search: search || undefined,
    limit: PAGE,
    offset,
  });

  const refresh = () => {
    runsQuery.refetch();
    snapshot.refetch();
    credits.refetch();
  };

  const runs = runsQuery.data?.runs ?? [];
  const publishedRunId = runsQuery.data?.publishedRunId ?? null;
  const workingRunId = runsQuery.data?.workingRunId ?? null;
  const unmatched = runsQuery.data?.unmatched ?? 0;
  const counts = snapshot.data?.counts;
  const working = workingRunId ? runs.find((r) => r.id === workingRunId) : undefined;
  const inFlight = runs.find((r) => IN_FLIGHT.has(r.status));
  const draft = inFlight ?? working;
  const published = publishedRunId ? runs.find((r) => r.id === publishedRunId) : undefined;

  // Default the version picker to the published column (or newest draft).
  useEffect(() => {
    if (runId) return;
    const def = publishedRunId ?? workingRunId ?? runs.find((r) => r.status !== "failed")?.id;
    if (def) setRunId(def);
  }, [store, publishedRunId, workingRunId, runs, runId]);

  const viewingRun = runs.find((r) => r.id === runId);
  const isLiveVersion = !!runId && runId === publishedRunId;

  const creditsAmount = credits.data?.creditsRemaining != null
    ? Number(credits.data.creditsRemaining)
    : NaN;
  const creditsCurrency = credits.data?.currency ?? "EUR";
  const creditsLow = Number.isFinite(creditsAmount) && creditsAmount < 5;
  const creditsError = credits.data?.error ?? credits.error;
  const creditsLabel = Number.isFinite(creditsAmount)
    ? formatCredits(creditsAmount, creditsCurrency)
    : credits.isLoading
      ? "…"
      : "Unavailable";

  const step = useMemo(() => activeStep(draft, unmatched), [draft, unmatched]);

  async function runToCompletion(action: string, label: string, extraArgs: Record<string, unknown> = {}) {
    let consecutiveErrors = 0;
    for (let i = 0; i < 2000; i++) {
      let r: { remaining?: number; status?: string };
      try {
        r = await chefAdmin<{ remaining?: number; status?: string }>(action, {
          storeDomain: store,
          refreshRunId: draft?.id,
          ...extraArgs,
        });
        consecutiveErrors = 0;
      } catch (e) {
        consecutiveErrors++;
        if (consecutiveErrors >= 6) throw e;
        setBusy(`${label} · retrying (${consecutiveErrors}/6)`);
        await new Promise((res) => setTimeout(res, 2500));
        continue;
      }
      refresh();
      const remaining = r.remaining ?? 0;
      setBusy(remaining > 0 ? `${label} · ${remaining} remaining` : label);
      if (remaining === 0 || r.status === "complete") break;
    }
  }

  async function buyCatalogue() {
    const storeLabel = STORES.find((s) => s.domain === store)?.label ?? store;
    const bal = Number.isFinite(creditsAmount)
      ? ` Balance: ${formatCredits(creditsAmount, creditsCurrency)}.`
      : "";
    if (!confirm(`Buy today's ${storeLabel} catalogue from Pepesto for €9.90?${bal}\n\nThe dump is saved before any processing — a crash never wastes the purchase.`)) {
      return;
    }
    setBusy("Buying catalogue");
    setToast(null);
    try {
      await chefAdmin("catalog.refresh.start", { storeDomain: store });
      setToast("Import started — dump will be saved, then auto-diffed.");
      setRunId("");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Import failed to start");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function matchNewItems() {
    if (!draft) return;
    setBusy("Matching new items");
    setToast(null);
    try {
      await runToCompletion("catalog.freezeAisles", "Freezing aisles", { maxBatches: 1 });
      await runToCompletion("catalog.match", "Matching", {});
      setToast("Matching complete — ready to publish.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Matching failed");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function publishDraft() {
    if (!draft) return;
    if (!confirm("Publish this catalogue version? Phones, Chef, and grocery search will switch to it.")) {
      return;
    }
    setBusy("Publishing");
    setToast(null);
    try {
      await chefAdmin("catalog.publish", { runId: draft.id });
      setToast("Published — live in the app.");
      setRunId(draft.id);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function unpublishStore() {
    if (!confirm("Unpublish the live catalogue? The previous published version will be restored if one exists.")) {
      return;
    }
    setBusy("Unpublishing");
    try {
      const r = await chefAdmin<{ publishedRunId: string | null }>("catalog.unpublish", {
        storeDomain: store,
      });
      setToast(r.publishedRunId ? "Fell back to the previous published version." : "No published version left.");
      setRunId(r.publishedRunId ?? "");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Unpublish failed");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function deleteImport(id: string) {
    if (!confirm("Delete this import and its SKU rows? This cannot be undone.")) return;
    setBusy("Deleting");
    try {
      await chefAdmin("catalog.deleteRun", { runId: id });
      setToast("Import deleted.");
      if (runId === id) setRunId("");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  async function retryIngest(id: string) {
    setBusy("Retrying ingest (free)");
    try {
      await chefAdmin("catalog.refresh.retry", { runId: id });
      setToast("Re-diff started from the saved dump.");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Retry failed");
    } finally {
      setBusy(null);
      refresh();
    }
  }

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Catalogue</h1>
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label="How this page works"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-2">
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
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-500 transition-colors hover:bg-neutral-50"
          >
            <BookOpen className="h-4 w-4" /> Skill docs
          </button>
          <div
            className="ml-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-right"
            title={creditsError
              ? `Pepesto /credits error: ${creditsError}`
              : credits.data?.checkedAt
                ? `Live from Pepesto · updated ${new Date(credits.data.checkedAt).toLocaleTimeString("en-GB")}`
                : "Live from Pepesto /credits"}
          >
            <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
              Pepesto balance
            </div>
            <div className={cn(
              "text-sm font-semibold tabular-nums",
              creditsError ? "text-amber-600" : creditsLow ? "text-red-600" : "text-neutral-900",
            )}>
              {creditsLabel}
            </div>
          </div>
        </div>
      </div>

      {showInfo ? <InfoPanel onClose={() => setShowInfo(false)} /> : null}

      <div className="mt-6 flex gap-2">
        {STORES.map((s) => (
          <button
            key={s.domain}
            type="button"
            onClick={() => {
              setStore(s.domain);
              setRunId("");
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

      {/* 4-step import wizard */}
      <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
              Import & publish
            </div>
            {published ? (
              <div className="mt-0.5 text-sm text-neutral-700">
                Live in app: <span className="font-semibold">{fmtDateTime(published.importedAt ?? published.startedAt)}</span>
                <span className="ml-2 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  Live
                </span>
              </div>
            ) : (
              <div className="mt-0.5 text-sm text-neutral-400">No published version yet</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {published ? (
              <button
                type="button"
                disabled={!!busy}
                onClick={unpublishStore}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
              >
                Unpublish
              </button>
            ) : null}
            {draft && draft.status !== "published" && !IN_FLIGHT.has(draft.status) ? (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => deleteImport(draft.id)}
                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete this import
              </button>
            ) : null}
          </div>
        </div>

        <ol className="mt-4 space-y-3">
          <StepRow
            n={1}
            title="Buy catalogue (€9.90)"
            done={!!draft && !IN_FLIGHT.has(draft.status) && draft.status !== "failed"}
            active={step === 1}
            body={
              draft?.status === "failed" && draft.hasRawDump ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-red-600">Import failed after dump saved — retry is free.</span>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => retryIngest(draft.id)}
                    className="flex items-center gap-1 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Retry ingest (free)
                  </button>
                </div>
              ) : draft && draft.hasRawDump && !IN_FLIGHT.has(draft.status) ? (
                <p className="text-sm text-neutral-600">
                  Imported {fmtDateTime(draft.importedAt ?? draft.startedAt)} · dump saved
                </p>
              ) : (
                <button
                  type="button"
                  disabled={!!busy || !!inFlight}
                  onClick={buyCatalogue}
                  className="flex items-center gap-2 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-40"
                >
                  <CloudDownload className="h-4 w-4" />
                  {inFlight?.status === "fetching" ? "Buying…" : "Buy catalogue (€9.90)"}
                </button>
              )
            }
          />

          <StepRow
            n={2}
            title="Comparing to live catalogue…"
            done={!!draft && ["awaiting_match", "matching", "ready", "published"].includes(draft.status)}
            active={step === 2}
            body={
              draft && (draft.status === "diffing" || draft.status === "imported" || draft.status === "fetching") ? (
                <DiffProgress run={draft} />
              ) : draft && draft.newSkus != null ? (
                <p className="text-sm text-neutral-600">
                  {draft.newSkus > 0
                    ? `${draft.newSkus} new need Gemini`
                    : "No new SKUs — ready for publish after review"}
                  {draft.priceChanged ? ` · ${draft.priceChanged} price updates` : ""}
                  {draft.droppedSkus ? ` · ${draft.droppedSkus} historic` : ""}
                </p>
              ) : (
                <p className="text-sm text-neutral-400">Starts automatically after import</p>
              )
            }
          />

          <StepRow
            n={3}
            title={unmatched > 0 ? `Match new items with Gemini (${unmatched})` : "Match new items with Gemini"}
            done={!!draft && unmatched === 0 && ["ready", "published", "matching", "awaiting_match"].includes(draft.status) && !IN_FLIGHT.has(draft.status)}
            active={step === 3}
            body={
              unmatched > 0 && draft && !IN_FLIGHT.has(draft.status) ? (
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={matchNewItems}
                  className="flex items-center gap-2 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  <Play className="h-4 w-4" /> Match new items ({unmatched})
                </button>
              ) : (
                <p className="text-sm text-neutral-400">
                  {draft && unmatched === 0 && !IN_FLIGHT.has(draft.status)
                    ? "Nothing left to match"
                    : "Runs only when step 2 finishes with new SKUs"}
                </p>
              )
            }
          />

          <StepRow
            n={4}
            title="Publish to app"
            done={draft?.status === "published" || (!!draft && draft.id === publishedRunId)}
            active={step === 4}
            body={
              draft && draft.status !== "published" && draft.id !== publishedRunId && !IN_FLIGHT.has(draft.status) ? (
                <button
                  type="button"
                  disabled={!!busy || unmatched > 0 || draft.status === "failed"}
                  onClick={publishDraft}
                  className="flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  <Upload className="h-4 w-4" /> Publish to app
                </button>
              ) : draft?.id === publishedRunId ? (
                <p className="text-sm font-medium text-emerald-700">Live in app</p>
              ) : (
                <p className="text-sm text-neutral-400">Enabled when unmatched = 0</p>
              )
            }
          />
        </ol>

        {busy ? <div className="mt-3 text-sm text-neutral-500">{busy}…</div> : null}
        {draft?.status === "failed" && draft.error ? (
          <div className="mt-3 text-xs text-red-600">{draft.error}</div>
        ) : null}
      </div>

      {toast ? (
        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-600">{toast}</div>
      ) : null}

      {/* Version viewer + filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-neutral-200">
          {BUCKET_TABS.map(([val, label]) => (
            <button
              key={val || "all"}
              type="button"
              onClick={() => { setBucket(val); setOffset(0); }}
              className={cn(
                "px-3 py-2 text-sm transition-colors",
                bucket === val ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-50",
              )}
            >
              {label}
              {val === "new" && counts ? ` (${counts.new})` : null}
              {val === "historic" && counts ? ` (${counts.historic})` : null}
            </button>
          ))}
        </div>
        <select
          value={runId}
          onChange={(e) => { setRunId(e.target.value); setOffset(0); }}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700"
        >
          {runs.filter((r) => r.status !== "failed" && r.status !== "fetching").map((r) => {
            const live = r.id === publishedRunId;
            return (
              <option key={r.id} value={r.id}>
                {fmtDateTime(r.importedAt ?? r.startedAt)}
                {live ? " · Live" : r.status === "ready" ? " · Ready" : r.status === "awaiting_match" ? " · Draft" : ""}
              </option>
            );
          })}
        </select>
        <Select value={aisle} onChange={(v) => { setAisle(v); setOffset(0); }} label="All aisles" options={AISLE_OPTIONS} />
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOffset(0); }}
          placeholder="Search name / semantic"
          className="min-w-56 flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
        />
      </div>

      {viewingRun && !isLiveVersion ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Viewing {fmtDateTime(viewingRun.importedAt ?? viewingRun.startedAt)} — prices are that version’s.
          {viewingRun.status === "published" ? "" : " Not live in the app until you Publish."}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Semantic</th>
              <th className="px-4 py-3 font-medium">Aisle</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {snapshot.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">Loading…</td></tr>
            ) : (snapshot.data?.skus.length ?? 0) === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">No SKUs match.</td></tr>
            ) : (
              snapshot.data!.skus.map((row) => {
                const e = edits[row.id] ?? {};
                const semVal = e.semanticName ?? row.semanticName ?? "";
                const aisleVal = e.aisle ?? row.aisle ?? "";
                const tierVal = e.budgetTier ?? row.budgetTier ?? "";
                const rowDirty = !!edits[row.id];
                const isEditingName = editingName === row.id;
                const historic = row.bucket === "historic";
                const price = historic
                  ? "—"
                  : fmtPence(row.currentPrice, row.currency ?? "GBP");
                return (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-neutral-100 transition-colors hover:bg-neutral-50",
                    rowDirty ? "bg-amber-50/60" : null,
                    historic ? "opacity-60" : null,
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
                  <td className="px-4 py-2.5"><BucketBadge bucket={row.bucket} /></td>
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
                  </td>
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
                  </td>
                  <td className="cursor-pointer px-4 py-2.5 font-mono text-xs text-neutral-700" onClick={() => setSelected(row)}>{price}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {snapshot.data && snapshot.data.total > PAGE ? (
        <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
          <span>{offset + 1}–{Math.min(offset + PAGE, snapshot.data.total)} of {snapshot.data.total}</span>
          <div className="flex gap-2">
            <button type="button" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))} className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40">Prev</button>
            <button type="button" disabled={offset + PAGE >= snapshot.data.total} onClick={() => setOffset(offset + PAGE)} className="rounded-lg border border-neutral-200 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      ) : null}

      {selected ? <SkuDetailDrawer sku={selected} onClose={() => setSelected(null)} /> : null}
      {showSkill ? <SkillDocsModal onClose={() => setShowSkill(false)} /> : null}
    </div>
  );
}

function activeStep(draft: CatalogRefreshRun | undefined, unmatched: number): 1 | 2 | 3 | 4 {
  if (!draft || draft.status === "failed") return 1;
  if (IN_FLIGHT.has(draft.status)) return draft.status === "fetching" ? 1 : 2;
  if (unmatched > 0) return 3;
  if (draft.status === "published") return 4;
  return 4;
}

function DiffProgress({ run }: { run: CatalogRefreshRun }) {
  const incoming = run.incoming ?? 0;
  const processed = run.processed ?? 0;
  const total = Math.max(incoming + (run.droppedSkus ?? 0), processed, 1);
  const pct = Math.min(100, Math.round((processed / total) * 100));
  return (
    <div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div className="h-full rounded-full bg-neutral-900 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-sm text-neutral-600">
        {processed.toLocaleString("en-GB")} / {total.toLocaleString("en-GB")} SKUs
        {run.matchedSame != null ? ` · ${run.matchedSame.toLocaleString("en-GB")} same` : ""}
        {run.priceChanged != null ? ` · ${run.priceChanged.toLocaleString("en-GB")} price updates` : ""}
        {run.droppedSkus != null ? ` · ${run.droppedSkus.toLocaleString("en-GB")} historic` : ""}
        {run.newSkus != null ? ` · ${run.newSkus.toLocaleString("en-GB")} new` : ""}
      </p>
    </div>
  );
}

function StepRow({
  n, title, done, active, body,
}: {
  n: number;
  title: string;
  done: boolean;
  active: boolean;
  body: ReactNode;
}) {
  return (
    <li className={cn(
      "rounded-xl border px-4 py-3",
      active ? "border-neutral-900 bg-neutral-50" : "border-neutral-100",
      done && !active ? "opacity-80" : null,
    )}>
      <div className="flex items-center gap-2">
        <span className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
          done ? "bg-emerald-600 text-white" : active ? "bg-neutral-900 text-white" : "bg-neutral-200 text-neutral-600",
        )}>
          {done ? <Check className="h-3.5 w-3.5" /> : n}
        </span>
        <span className="text-sm font-semibold text-neutral-900">{title}</span>
      </div>
      <div className="mt-2 pl-8">{body}</div>
    </li>
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

function BucketBadge({ bucket }: { bucket: SnapshotBucket }) {
  if (bucket === "matched") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <Check className="h-3 w-3" /> matched
      </span>
    );
  }
  if (bucket === "new") {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">new</span>;
  }
  return <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">historic</span>;
}

function fmtDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCredits(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function InfoPanel({ onClose }: { onClose: () => void }) {
  const items: Array<{ title: string; body: string }> = [
    {
      title: "Four steps",
      body: "1) Buy a Pepesto dump (€9.90) — saved before any processing. 2) Auto-diff against the live catalogue with a progress bar. 3) Gemini-match only new SKUs. 4) Publish — phones and Chef switch to that version.",
    },
    {
      title: "Publish gate",
      body: "Prices and matches in a draft never go live until you Publish. Unpublish falls back to the previous published version. Delete only removes a non-published import.",
    },
    {
      title: "Version date picker",
      body: "Each import is a dated column. The default is the Live (published) version. Pick another date to review that version’s SKUs and prices — filters apply only to the selected version.",
    },
    {
      title: "Retry is free",
      body: "If diff fails after the dump is saved, use Retry ingest (free). Never rebuy unless you want a brand-new dump.",
    },
    {
      title: "Pepesto balance",
      body: "Top-right prepaid credits. Check before Step 1. A failed fetch after Pepesto charges still spends €9.90 — the dump is what we protect once it arrives.",
    },
  ];

  return (
    <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">How this page works</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.title}>
            <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              {item.title}
            </dt>
            <dd className="mt-0.5 text-sm text-neutral-600">{item.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

"use client";

import { Fragment, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  ListChecks,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";

/**
 * /admin/testing — the TestFlight beta feedback queue (ADR-074).
 *
 * Two levels, the Sentry events-vs-issues model /admin/errors trained us on:
 *   - CLUSTERS (default once the enrich sweep has run): one row per underlying issue with
 *     report count, severity, and the ratify-only AI actions — Draft brief (a Cursor build
 *     brief saved on the cluster for Simon to edit and hand over) and Copy reporter emails.
 *   - REPORTS: the flat per-row view (works before the sweep exists / for unenriched rows),
 *     with screenshot thumbnails, kind/detail chips, and per-row triage.
 *
 * AI never auto-runs Cursor and never auto-sends anything — every output here is a document
 * or a clipboard payload.
 */

type FeedbackRow = {
  id: string;
  ownerId: string | null;
  createdAt: number;
  kind: string;
  detail: string | null;
  comment: string | null;
  screenId: string | null;
  appVersion: string | null;
  buildNumber: string | null;
  osVersion: string | null;
  deviceModel: string | null;
  trigger: string;
  screenshotPath: string | null;
  screenshotUrl: string | null;
  source: string;
  status: "open" | "triaged" | "resolved" | "dismissed";
  clusterId: string | null;
  severity: string | null;
  aiSummary: string | null;
  enrichedAt: number | null;
};

type ClusterRow = {
  id: string;
  createdAt: number;
  lastModified: number;
  title: string;
  summary: string | null;
  kind: string | null;
  severity: string | null;
  status: "open" | "briefed" | "fixing" | "resolved";
  fixedInBuild: string | null;
  briefMd: string | null;
  reportCount: number;
  reporterCount: number;
};

type TestingResponse = {
  feedback: FeedbackRow[];
  clusters: ClusterRow[];
  unenrichedCount: number;
};

const KINDS = ["design", "bug", "content", "checkout", "other"] as const;
const ROW_STATUSES = ["open", "triaged", "resolved", "dismissed"] as const;
const CLUSTER_STATUSES = ["open", "briefed", "fixing", "resolved"] as const;

function fmtDateShort(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityTone(severity: string | null): string {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-300";
    case "high":
      return "bg-red-50 text-red-700 border-red-200";
    case "medium":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "low":
      return "bg-neutral-100 text-neutral-500 border-neutral-200";
    default:
      return "bg-neutral-100 text-neutral-400 border-neutral-200";
  }
}

function kindTone(kind: string | null): string {
  switch (kind) {
    case "design":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "bug":
      return "bg-red-50 text-red-700 border-red-200";
    case "content":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "checkout":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

function statusTone(status: string): string {
  switch (status) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "dismissed":
      return "bg-neutral-100 text-neutral-500 border-neutral-200";
    case "briefed":
    case "fixing":
    case "triaged":
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={cn("w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase", tone)}>
      {children}
    </span>
  );
}

export default function TestingPage() {
  const { data, error, isLoading, refetch } = useChefQuery<TestingResponse>(
    "testing.list",
    {},
    { pollMs: 30000 },
  );

  const clusters = data?.clusters ?? [];
  const feedback = data?.feedback ?? [];
  const [tab, setTab] = useState<"clusters" | "reports">("clusters");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [digest, setDigest] = useState<string | null>(null);

  const run = async (key: string, work: () => Promise<void>) => {
    setBusy(key);
    setActionError(null);
    try {
      await work();
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Testing</h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Beta feedback from the in-app reporter (screenshot pill / shake, TestFlight only).
            The enrich sweep clusters raw reports into issues every 20 minutes; work
            cluster-by-cluster, draft a Cursor brief per cluster, and copy reporter emails for
            a thank-you when a fix ships. AI drafts — you ratify.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={busy === "sweep"}
            onClick={() =>
              void run("sweep", async () => {
                const res = await chefAdmin<{ enriched: number; clustersCreated: number }>(
                  "testing.enrichSweep",
                  {},
                );
                setNotice(`Sweep: enriched ${res.enriched}, new clusters ${res.clustersCreated}.`);
              })
            }
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {busy === "sweep" ? "Sweeping…" : "Run sweep"}
          </button>
          <button
            type="button"
            disabled={busy === "digest"}
            onClick={() =>
              void run("digest", async () => {
                const res = await chefAdmin<{ digest: string; clusterCount: number }>(
                  "testing.digest",
                  {},
                );
                setDigest(
                  res.clusterCount === 0
                    ? "No resolved clusters with a fixed-in build yet."
                    : res.digest,
                );
              })
            }
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
          >
            <ListChecks className="h-4 w-4" />
            {busy === "digest" ? "Drafting…" : "What to Test"}
          </button>
          <button
            type="button"
            onClick={refetch}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {notice ? (
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {notice}
        </div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Couldn&rsquo;t load testing feedback: {error}. This view needs the{" "}
          <code className="rounded bg-amber-100 px-1">testing.list</code> chef-admin action
          deployed.
        </div>
      ) : null}
      {digest !== null ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-emerald-900">
              &ldquo;What to Test&rdquo; draft (paste into TestFlight build notes)
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(digest)}
                className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
              <button
                type="button"
                onClick={() => setDigest(null)}
                className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Close
              </button>
            </div>
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-emerald-900">{digest}</pre>
        </div>
      ) : null}

      <div className="mt-6 flex items-center gap-2">
        {(["clusters", "reports"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              tab === t
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {t === "clusters"
              ? `Clusters (${clusters.filter((c) => c.status !== "resolved").length})`
              : `Reports (${feedback.length})`}
          </button>
        ))}
        {data && data.unenrichedCount > 0 ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
            {data.unenrichedCount} awaiting the sweep
          </span>
        ) : null}
      </div>

      {tab === "clusters" ? (
        <ClustersTable
          clusters={clusters}
          feedback={feedback}
          isLoading={isLoading}
          busy={busy}
          run={run}
        />
      ) : (
        <ReportsTable feedback={feedback} isLoading={isLoading} busy={busy} run={run} />
      )}
    </div>
  );
}

// ── Clusters (issues) ────────────────────────────────────────────────────────────────────

function ClustersTable({
  clusters,
  feedback,
  isLoading,
  busy,
  run,
}: {
  clusters: ClusterRow[];
  feedback: FeedbackRow[];
  isLoading: boolean;
  busy: string | null;
  run: (key: string, work: () => Promise<void>) => Promise<void>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [buildInput, setBuildInput] = useState("");
  const [briefOpenId, setBriefOpenId] = useState<string | null>(null);

  const rows = clusters.filter((c) => showResolved || c.status !== "resolved");

  return (
    <div className="mt-4">
      <label className="flex w-fit items-center gap-2 text-xs text-neutral-500">
        <input
          type="checkbox"
          checked={showResolved}
          onChange={(e) => setShowResolved(e.target.checked)}
        />
        Show resolved
      </label>

      <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Issue</th>
              <th className="px-4 py-3 text-right font-medium">Reports</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                  No clusters yet — they appear once the enrich sweep has processed the first
                  reports (every 20 minutes, or Run sweep above).
                </td>
              </tr>
            ) : (
              rows.map((cluster) => {
                const isOpen = expandedId === cluster.id;
                const members = feedback.filter((f) => f.clusterId === cluster.id);
                return (
                  <Fragment key={cluster.id}>
                    <tr
                      onClick={() => setExpandedId(isOpen ? null : cluster.id)}
                      className={cn(
                        "cursor-pointer border-b border-neutral-100 align-top transition-colors hover:bg-neutral-50",
                        isOpen && "bg-neutral-50",
                      )}
                    >
                      <td className="px-4 py-3 text-neutral-400">
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{cluster.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {cluster.kind ? <Chip tone={kindTone(cluster.kind)}>{cluster.kind}</Chip> : null}
                          {cluster.briefMd ? (
                            <Chip tone="bg-violet-50 text-violet-700 border-violet-200">brief drafted</Chip>
                          ) : null}
                          {cluster.fixedInBuild ? (
                            <Chip tone="bg-emerald-50 text-emerald-700 border-emerald-200">
                              fixed in {cluster.fixedInBuild}
                            </Chip>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            cluster.reportCount > 1
                              ? "bg-neutral-900 text-white"
                              : "bg-neutral-100 text-neutral-500",
                          )}
                        >
                          ×{cluster.reportCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Chip tone={severityTone(cluster.severity)}>{cluster.severity ?? "—"}</Chip>
                      </td>
                      <td className="px-4 py-3">
                        <Chip tone={statusTone(cluster.status)}>{cluster.status}</Chip>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                        {fmtDateShort(cluster.lastModified)}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <td />
                        <td colSpan={5} className="px-4 py-4">
                          {cluster.summary ? (
                            <p className="mb-3 max-w-3xl text-sm text-neutral-600">{cluster.summary}</p>
                          ) : null}

                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            {CLUSTER_STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={busy != null || cluster.status === s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void run(`cluster-${cluster.id}`, async () => {
                                    await chefAdmin("testing.setStatus", {
                                      clusterId: cluster.id,
                                      status: s,
                                      ...(s === "resolved" && buildInput.trim()
                                        ? { fixedInBuild: buildInput.trim() }
                                        : {}),
                                    });
                                  });
                                }}
                                className={cn(
                                  "rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                  cluster.status === s
                                    ? "border-neutral-900 bg-neutral-900 text-white"
                                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                                )}
                              >
                                {s}
                              </button>
                            ))}
                            <input
                              type="text"
                              value={buildInput}
                              onChange={(e) => setBuildInput(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="fixed in build (e.g. 0.1.0 (12))"
                              className="w-44 rounded-lg border border-neutral-200 px-2 py-1 text-xs text-neutral-700"
                            />
                            <span className="mx-1 h-5 w-px bg-neutral-200" />
                            <button
                              type="button"
                              disabled={busy === `brief-${cluster.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void run(`brief-${cluster.id}`, async () => {
                                  await chefAdmin("testing.draftBrief", { clusterId: cluster.id });
                                  setBriefOpenId(cluster.id);
                                });
                              }}
                              className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-40"
                            >
                              <FileText className="h-3 w-3" />
                              {busy === `brief-${cluster.id}`
                                ? "Drafting…"
                                : cluster.briefMd
                                  ? "Redraft brief"
                                  : "Draft brief"}
                            </button>
                            {cluster.briefMd ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBriefOpenId(briefOpenId === cluster.id ? null : cluster.id);
                                }}
                                className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                              >
                                {briefOpenId === cluster.id ? "Hide brief" : "View brief"}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              disabled={busy === `emails-${cluster.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                void run(`emails-${cluster.id}`, async () => {
                                  const res = await chefAdmin<{ emails: string[] }>(
                                    "testing.reporterEmails",
                                    { clusterId: cluster.id },
                                  );
                                  await navigator.clipboard.writeText(res.emails.join(", "));
                                });
                              }}
                              className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 disabled:opacity-40"
                            >
                              <Copy className="h-3 w-3" /> Copy reporter emails
                            </button>
                          </div>

                          {briefOpenId === cluster.id && cluster.briefMd ? (
                            <div className="mb-4 rounded-xl border border-violet-200 bg-white p-4">
                              <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-violet-500">
                                  Cursor build brief (draft — edit &amp; ratify before handing over)
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => void navigator.clipboard.writeText(cluster.briefMd ?? "")}
                                  className="flex items-center gap-1 rounded-lg border border-violet-200 px-2 py-1 text-xs text-violet-700 hover:bg-violet-50"
                                >
                                  <Copy className="h-3 w-3" /> Copy
                                </button>
                              </div>
                              <pre className="max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs text-neutral-800">
                                {cluster.briefMd}
                              </pre>
                            </div>
                          ) : null}

                          <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
                            Reports in this cluster ({members.length}, {cluster.reporterCount} reporter
                            {cluster.reporterCount === 1 ? "" : "s"})
                          </h3>
                          <ul className="mt-2 space-y-2">
                            {members.map((row) => (
                              <li key={row.id} className="flex items-start gap-3 border-t border-neutral-100 py-2 text-xs">
                                {row.screenshotUrl ? (
                                  <a href={row.screenshotUrl} target="_blank" rel="noreferrer">
                                    {/* Signed, short-lived Storage URL — next/image gains nothing here. */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={row.screenshotUrl}
                                      alt="Report screenshot"
                                      className="h-16 w-9 shrink-0 rounded border border-neutral-200 object-cover"
                                    />
                                  </a>
                                ) : null}
                                <div className="min-w-0">
                                  <div className="text-neutral-700">
                                    {row.aiSummary ?? row.comment ?? "(no comment)"}
                                  </div>
                                  <div className="mt-1 text-[11px] text-neutral-400">
                                    {[
                                      row.screenId,
                                      row.detail,
                                      row.deviceModel,
                                      row.appVersion && `v${row.appVersion} (${row.buildNumber ?? "?"})`,
                                      row.trigger,
                                      fmtDateShort(row.createdAt),
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Reports (flat rows — the invite-day view; also unenriched/orphan triage) ─────────────

function ReportsTable({
  feedback,
  isLoading,
  busy,
  run,
}: {
  feedback: FeedbackRow[];
  isLoading: boolean;
  busy: string | null;
  run: (key: string, work: () => Promise<void>) => Promise<void>;
}) {
  const [status, setStatus] = useState<string>("open");
  const [kind, setKind] = useState<string>("all");
  const [screen, setScreen] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const screens = Array.from(new Set(feedback.map((f) => f.screenId).filter(Boolean))) as string[];
  const rows = feedback.filter(
    (f) =>
      (status === "all" || f.status === status) &&
      (kind === "all" || f.kind === kind) &&
      (screen === "all" || f.screenId === screen),
  );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {["open", "triaged", "resolved", "dismissed", "all"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              status === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {s}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-neutral-200" />
        {["all", ...KINDS].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              kind === k
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {k}
          </button>
        ))}
        {screens.length > 0 ? (
          <select
            value={screen}
            onChange={(e) => setScreen(e.target.value)}
            className="rounded-lg border border-neutral-200 px-2 py-1.5 text-xs text-neutral-600"
          >
            <option value="all">All screens</option>
            {screens.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Report</th>
              <th className="px-4 py-3 font-medium">Screen</th>
              <th className="px-4 py-3 font-medium">Device / build</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-neutral-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                  No reports match. Invite testers and they&rsquo;ll appear here as they arrive.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const isOpen = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={() => setExpandedId(isOpen ? null : row.id)}
                      className={cn(
                        "cursor-pointer border-b border-neutral-100 align-top transition-colors hover:bg-neutral-50",
                        isOpen && "bg-neutral-50",
                      )}
                    >
                      <td className="px-4 py-3">
                        {row.screenshotUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.screenshotUrl}
                            alt="Report screenshot"
                            className="h-14 w-8 rounded border border-neutral-200 object-cover"
                          />
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Chip tone={kindTone(row.kind)}>{row.kind}</Chip>
                          {row.detail ? (
                            <Chip tone="bg-neutral-100 text-neutral-600 border-neutral-200">
                              {row.detail}
                            </Chip>
                          ) : null}
                          {row.severity ? (
                            <Chip tone={severityTone(row.severity)}>{row.severity}</Chip>
                          ) : null}
                          {!row.enrichedAt ? (
                            <Chip tone="bg-amber-50 text-amber-700 border-amber-200">unenriched</Chip>
                          ) : null}
                        </div>
                        <div className="mt-1 line-clamp-2 max-w-md break-words text-neutral-700">
                          {row.aiSummary ?? row.comment ?? "(no comment)"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-neutral-600">
                        {row.screenId ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-500">
                        <div>{row.deviceModel ?? "—"}</div>
                        <div>
                          {row.appVersion ? `v${row.appVersion} (${row.buildNumber ?? "?"})` : ""}{" "}
                          {row.osVersion ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Chip tone={statusTone(row.status)}>{row.status}</Chip>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                        {fmtDateShort(row.createdAt)}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <td />
                        <td colSpan={5} className="px-4 py-4">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {ROW_STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={busy != null || row.status === s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void run(`row-${row.id}`, async () => {
                                    await chefAdmin("testing.setStatus", {
                                      feedbackId: row.id,
                                      status: s,
                                    });
                                  });
                                }}
                                className={cn(
                                  "rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                  row.status === s
                                    ? "border-neutral-900 bg-neutral-900 text-white"
                                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          {row.comment ? (
                            <p className="mb-3 max-w-3xl whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-neutral-800 ring-1 ring-neutral-200">
                              {row.comment}
                            </p>
                          ) : null}
                          <div className="text-xs text-neutral-500">
                            {[
                              `trigger: ${row.trigger}`,
                              `source: ${row.source}`,
                              row.ownerId ? `owner: ${row.ownerId}` : "pre-auth (no account)",
                              row.clusterId ? `cluster: ${row.clusterId}` : "unclustered",
                              `id: ${row.id}`,
                            ].join(" · ")}
                          </div>
                          {row.screenshotUrl ? (
                            <a
                              href={row.screenshotUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="mt-3 inline-block"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={row.screenshotUrl}
                                alt="Report screenshot (full)"
                                className="max-h-96 rounded-xl border border-neutral-200"
                              />
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { Fragment, useState } from "react";
import { Activity, ChevronDown, ChevronRight, ExternalLink, RefreshCw } from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";

type ErrorSample = {
  source: string;
  id: string;
  message: string;
  at: number;
  severity: string | null;
  screen: string | null;
  userId: string | null;
  userName: string | null;
  appVersion: string | null;
  osVersion: string | null;
  deviceModel: string | null;
  domain: string | null;
  context: string | null;
  code: string | null;
  stage: string | null;
};

type ErrorGroup = {
  fingerprint: string;
  source: string;
  severity: string | null;
  domain: string | null;
  count: number;
  userCount: number;
  firstAt: number;
  lastAt: number;
  status: "open" | "resolved" | "muted";
  sample: ErrorSample;
};

type ErrorsResponse = { groups: ErrorGroup[]; occurrences: number };

type OpsAlert = {
  id: string;
  createdAt: number;
  kind: string;
  severity: string;
  title: string;
  detail: Record<string, unknown> | null;
  notified: boolean;
};

type CronRow = {
  jobname: string;
  schedule: string;
  active: boolean;
  lastStatus: string | null;
  lastRunAt: number | null;
  lastMessage: string | null;
};

type OpsResponse = { alerts: OpsAlert[]; crons: CronRow[] };

type ImportBreakdown = {
  failuresByCode: { code: string; d1: number; d7: number }[];
  totals: {
    attempts7d: number;
    failed7d: number;
    rate429_1d: number;
    rate429_7d: number;
    rate429Pct7d: number;
  };
  spike429: boolean;
  suspect: {
    counts: { lowMatch1d: number; lowMatch7d: number; highInferred7d: number; recreated7d: number };
    rows: {
      id: string;
      ownerId: string | null;
      url: string;
      sourceType: string;
      at: number;
      quality: { matchRate?: number; ingredientCount?: number; inferredCount?: number; recreated?: boolean; score?: number } | null;
    }[];
  };
};

/** Crash/non-fatal deep dive for iOS client errors lives in Sentry (EU org). */
const SENTRY_ISSUES_URL = "https://foray.sentry.io/issues/";

/** Stable clock reference for the "last 24h" alert split (render must stay pure). */
const pageLoadedAt = Date.now();

/** Plain-English explanations for import failure codes (esp. 429, which is non-obvious). */
const CODE_EXPLAINER: Record<string, string> = {
  RATE_LIMITED_429:
    "HTTP 429 = Too Many Requests. Instagram/TikTok throttled an automated read from our servers. The on-device capture should usually avoid this; a spike here means the platform tightened limits.",
  LOGIN_WALL: "The post is behind a login/consent wall, so it can't be read without a session.",
  NOT_A_RECIPE: "The post/page had no identifiable full recipe to extract.",
  NO_RECIPE_CONTENT: "The post couldn't be read (private, or the caption had no recipe).",
  PAGE_FETCH_FAILED: "The page returned a non-OK HTTP status or timed out.",
  GEMINI_ERROR: "The AI extraction call failed (config, quota, or a transient error).",
  PROCESSING_TIMEOUT: "The background parse never reported a terminal result and was reaped.",
  MATCH_FAILED:
    "Legacy: ingredient catalogue matching threw. The catalogue was removed (ADR-040) — lines now carry embedded enrichment, so this code is only seen on historical rows.",
};

const SOURCE_LABEL: Record<string, string> = {
  job: "Chef job",
  import: "Import job",
  hero: "Hero image",
  checkout: "Checkout",
  client: "iOS client",
};

const TRIAGE_FILTERS = ["open", "resolved", "muted", "all"] as const;
type TriageFilter = (typeof TRIAGE_FILTERS)[number];

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtDateShort(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceTone(source: string): string {
  switch (source) {
    case "client":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "checkout":
      return "bg-red-50 text-red-700 border-red-200";
    case "hero":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "import":
      return "bg-sky-50 text-sky-700 border-sky-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

function severityTone(severity: string | null): string {
  switch (severity) {
    case "fatal":
      return "bg-red-100 text-red-800 border-red-300";
    case "error":
      return "bg-red-50 text-red-700 border-red-200";
    case "warning":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-neutral-100 text-neutral-500 border-neutral-200";
  }
}

function triageTone(status: string): string {
  switch (status) {
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "muted":
      return "bg-neutral-100 text-neutral-500 border-neutral-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-40 shrink-0 text-xs font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </dt>
      <dd className="break-words font-mono text-xs text-neutral-700">{value}</dd>
    </div>
  );
}

/** Ops health strip: active alerts written by the ops-alert cron + a last-run readout for
 * every pg_cron job, so a silently failing cron (e.g. an auth mismatch 401-ing every minute)
 * is visible here instead of only in edge-function logs. */
function OpsHealth() {
  const { data, error } = useChefQuery<OpsResponse>("ops.alerts", {}, { pollMs: 60000 });
  const [showAll, setShowAll] = useState(false);
  if (error) {
    return (
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Couldn&rsquo;t load ops health: {error}. This panel needs the{" "}
        <code className="rounded bg-amber-100 px-1">ops.alerts</code> chef-admin action deployed.
      </div>
    );
  }
  if (!data) return null;

  const dayAgo = pageLoadedAt - 86_400_000;
  const recentAlerts = data.alerts.filter((a) => a.createdAt >= dayAgo);
  const alerts = showAll ? data.alerts.slice(0, 20) : recentAlerts;

  return (
    <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Activity className="h-4 w-4 text-neutral-400" /> Ops health
        </h2>
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-xs text-neutral-500 underline decoration-neutral-300 underline-offset-2 hover:text-neutral-700"
        >
          {showAll ? "Recent alerts only" : "Show alert history"}
        </button>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Scheduled jobs (pg_cron)
          </h3>
          <table className="mt-2 w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-neutral-400">
                <th className="py-1 font-medium">Job</th>
                <th className="py-1 font-medium">Schedule</th>
                <th className="py-1 font-medium">Last run</th>
                <th className="py-1 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.crons.length === 0 ? (
                <tr><td colSpan={4} className="py-2 text-neutral-400">Cron readout unavailable.</td></tr>
              ) : (
                data.crons.map((c) => (
                  <tr key={c.jobname} className="border-t border-neutral-100">
                    <td className="py-1.5 font-mono text-neutral-700">{c.jobname}</td>
                    <td className="py-1.5 font-mono text-neutral-500">{c.schedule}</td>
                    <td className="py-1.5 text-neutral-500">
                      {c.lastRunAt ? fmtDateShort(c.lastRunAt) : "never"}
                    </td>
                    <td className="py-1.5">
                      <span
                        className={cn(
                          "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                          !c.active
                            ? "border-neutral-200 bg-neutral-100 text-neutral-500"
                            : c.lastStatus === "succeeded"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : c.lastStatus
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-neutral-200 bg-neutral-50 text-neutral-500",
                        )}
                        title={c.lastMessage ?? undefined}
                      >
                        {!c.active ? "inactive" : (c.lastStatus ?? "no runs")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-neutral-400">
            &ldquo;Succeeded&rdquo; means the cron fired — a job that calls an Edge Function can
            still fail downstream; those failures surface as ops alerts and in the error feed.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            {showAll ? "Alert history" : "Alerts (last 24h)"}
          </h3>
          {alerts.length === 0 ? (
            <p className="mt-2 text-xs text-neutral-400">
              {showAll ? "No alerts recorded." : "No alerts in the last 24 hours."}
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {alerts.map((a) => (
                <li key={a.id} className="flex items-start gap-2 border-t border-neutral-100 py-1.5 text-xs">
                  <span
                    className={cn(
                      "mt-0.5 shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                      a.severity === "critical"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    {a.severity}
                  </span>
                  <span className="text-neutral-700">{a.title}</span>
                  <span className="ml-auto shrink-0 text-neutral-400">{fmtDateShort(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** WS4: import-specific breakdown over /admin/errors. Axis 1 = hard failures by code with a
 * 429 spike alert ("Instagram changed something"); Axis 2 = succeeded-but-suspect imports that
 * auto-published at low quality (no review gate), so admin sees bad successes, not just errors. */
function ImportsBreakdown() {
  const { data } = useChefQuery<ImportBreakdown>("imports.breakdown", {}, { pollMs: 45000 });
  if (!data) return null;

  return (
    <div className="mt-6 space-y-4">
      {data.spike429 ? (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <strong>Possible Instagram/TikTok change:</strong> {data.totals.rate429Pct7d}% of imports in
          the last 7 days failed with HTTP 429 (rate limiting) — {data.totals.rate429_1d} in the last
          24h. When on-device capture misses, the server fallback gets throttled; a spike usually
          means the platform tightened limits.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Import failures by reason (7d / 24h)</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-neutral-400">
                <th className="py-1 font-medium">Code</th>
                <th className="py-1 text-right font-medium">24h</th>
                <th className="py-1 text-right font-medium">7d</th>
              </tr>
            </thead>
            <tbody>
              {data.failuresByCode.length === 0 ? (
                <tr><td colSpan={3} className="py-3 text-neutral-400">No import failures recorded.</td></tr>
              ) : (
                data.failuresByCode.map((r) => (
                  <tr key={r.code} className="border-t border-neutral-100">
                    <td className="py-1.5 font-mono text-xs text-neutral-700">{r.code}</td>
                    <td className="py-1.5 text-right text-neutral-600">{r.d1}</td>
                    <td className="py-1.5 text-right text-neutral-600">{r.d7}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-neutral-900">Succeeded but suspect (auto-published)</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Imports publish without a review gate. These passed but look low-quality: low ingredient
            match rate, many inferred fields, or recreated from a dish name.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
              Low match (7d): {data.suspect.counts.lowMatch7d}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
              High inferred (7d): {data.suspect.counts.highInferred7d}
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
              Recreated (7d): {data.suspect.counts.recreated7d}
            </span>
          </div>
          <ul className="mt-3 space-y-1.5">
            {data.suspect.rows.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 border-t border-neutral-100 py-1.5 text-xs">
                <span className="truncate font-mono text-neutral-600" title={r.url}>{r.url}</span>
                <span className="shrink-0 text-neutral-400">
                  {Math.round((r.quality?.matchRate ?? 0) * 100)}% match · {fmtDateShort(r.at)}
                </span>
              </li>
            ))}
            {data.suspect.rows.length === 0 ? (
              <li className="py-2 text-neutral-400">No suspect successes.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ErrorsPage() {
  const { data, error, isLoading, refetch } = useChefQuery<ErrorsResponse>(
    "errors.list",
    {},
    { pollMs: 45000 },
  );
  const [source, setSource] = useState<string>("all");
  const [triage, setTriage] = useState<TriageFilter>("open");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyFingerprint, setBusyFingerprint] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const all = data?.groups ?? [];
  const sources = Array.from(new Set(all.map((g) => g.source)));
  const rows = all.filter(
    (g) =>
      (source === "all" || g.source === source) &&
      (triage === "all" || g.status === triage),
  );
  const openCounts = all.filter((g) => g.status === "open").length;

  const setStatus = async (fingerprint: string, status: string) => {
    setBusyFingerprint(fingerprint);
    setActionError(null);
    try {
      await chefAdmin("errors.setStatus", { fingerprint, status });
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyFingerprint(null);
    }
  };

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Errors
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Failures from every layer, grouped: the same error is one row with an
            occurrence count, not a flood. Expand a group for the full technical
            context — screen, user, device, OS build, domain, message — then mark
            it resolved (reopens if it recurs) or muted (known noise). Crash-level
            detail for iOS client errors lives in Sentry.
          </p>
        </div>
        <button
          type="button"
          onClick={refetch}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <OpsHealth />
      <ImportsBreakdown />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TRIAGE_FILTERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTriage(t)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              triage === t
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {t === "open" ? `Open (${openCounts})` : t}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-neutral-200" />
        {["all", ...sources].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              source === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {s === "all" ? "All sources" : (SOURCE_LABEL[s] ?? s)}
          </button>
        ))}
      </div>

      {actionError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Couldn&rsquo;t load errors: {error}. This view needs the{" "}
          <code className="rounded bg-amber-100 px-1">errors.list</code> chef-admin
          action deployed.
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium" />
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Error</th>
              <th className="px-4 py-3 text-right font-medium">Count</th>
              <th className="px-4 py-3 text-right font-medium">Users</th>
              <th className="px-4 py-3 font-medium">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                  {triage === "open" ? "No open errors. All quiet." : "Nothing here."}
                </td>
              </tr>
            ) : (
              rows.map((group) => {
                const row = group.sample;
                const key = group.fingerprint;
                const isOpen = expandedId === key;
                const busy = busyFingerprint === key;
                return (
                  <Fragment key={key}>
                    <tr
                      onClick={() => setExpandedId(isOpen ? null : key)}
                      className={cn(
                        "cursor-pointer border-b border-neutral-100 align-top transition-colors hover:bg-neutral-50",
                        isOpen && "bg-neutral-50",
                      )}
                    >
                      <td className="px-4 py-3 text-neutral-400">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              "w-fit rounded-full border px-2 py-0.5 text-xs font-medium",
                              sourceTone(group.source),
                            )}
                          >
                            {SOURCE_LABEL[group.source] ?? group.source}
                          </span>
                          <div className="flex gap-1">
                            {group.severity ? (
                              <span
                                className={cn(
                                  "w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                                  severityTone(group.severity),
                                )}
                              >
                                {group.severity}
                              </span>
                            ) : null}
                            {group.status !== "open" ? (
                              <span
                                className={cn(
                                  "w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                                  triageTone(group.status),
                                )}
                              >
                                {group.status}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        <div className="line-clamp-2 max-w-md break-words">
                          {row.message}
                        </div>
                        {group.domain ? (
                          <div className="mt-0.5 font-mono text-[11px] text-neutral-400">
                            {group.domain}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            group.count > 1
                              ? "bg-neutral-900 text-white"
                              : "bg-neutral-100 text-neutral-500",
                          )}
                        >
                          ×{group.count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        {group.userCount || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                        {fmtDateShort(group.lastAt)}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <td />
                        <td colSpan={5} className="px-4 py-4">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            {(["open", "resolved", "muted"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={busy || group.status === s}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void setStatus(group.fingerprint, s);
                                }}
                                className={cn(
                                  "rounded-lg border px-2.5 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                  group.status === s
                                    ? "border-neutral-900 bg-neutral-900 text-white"
                                    : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                                )}
                              >
                                {s === "open" ? "Reopen" : s === "resolved" ? "Resolve" : "Mute"}
                              </button>
                            ))}
                            {group.source === "client" ? (
                              <a
                                href={`${SENTRY_ISSUES_URL}?query=${encodeURIComponent(row.message.slice(0, 80))}&statsPeriod=14d`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="ml-auto flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
                              >
                                Search in Sentry <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : null}
                          </div>
                          <dl className="space-y-2">
                            <DetailRow
                              label="Occurrences"
                              value={`${group.count} (${group.userCount} user${group.userCount === 1 ? "" : "s"}) · first ${fmtDate(group.firstAt)} · last ${fmtDate(group.lastAt)}`}
                            />
                            <DetailRow label="Latest error ID" value={row.id} />
                            <DetailRow label="Code" value={row.code} />
                            <DetailRow label="Stage" value={row.stage} />
                            {row.code && CODE_EXPLAINER[row.code] ? (
                              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
                                {CODE_EXPLAINER[row.code]}
                              </div>
                            ) : null}
                            <DetailRow label="Severity" value={row.severity} />
                            <DetailRow label="Domain" value={row.domain} />
                            <DetailRow label="Screen" value={row.screen} />
                            <DetailRow
                              label="User"
                              value={
                                row.userName && row.userId
                                  ? `${row.userName} (${row.userId})`
                                  : row.userId
                              }
                            />
                            <DetailRow label="Device" value={row.deviceModel} />
                            <DetailRow label="OS" value={row.osVersion} />
                            <DetailRow label="App build" value={row.appVersion} />
                            <DetailRow label="Context" value={row.context} />
                            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                              <dt className="w-40 shrink-0 text-xs font-medium uppercase tracking-wider text-neutral-400">
                                Message
                              </dt>
                              <dd className="whitespace-pre-wrap break-words rounded-lg bg-white p-3 font-mono text-xs text-neutral-800 ring-1 ring-neutral-200">
                                {row.message}
                              </dd>
                            </div>
                          </dl>
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

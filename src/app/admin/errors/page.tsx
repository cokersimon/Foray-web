"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";

type ErrorRow = {
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

type ErrorsResponse = { errors: ErrorRow[] };

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

function fmtDateShort(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** WS4: import-specific breakdown over /admin/errors. Axis 1 = hard failures by code with a
 * 429 spike alert ("Instagram changed something"); Axis 2 = succeeded-but-suspect imports that
 * auto-published at low quality (no review gate), so admin sees bad successes, not just errors. */
function ImportsBreakdown() {
  const { data } = useChefQuery<ImportBreakdown>("imports.breakdown", {}, { pollMs: 30000 });
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
    { pollMs: 30000 },
  );
  const [source, setSource] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const all = data?.errors ?? [];
  const sources = Array.from(new Set(all.map((e) => e.source)));
  const rows = source === "all" ? all : all.filter((e) => e.source === source);

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Errors
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Every failure recorded across the stack, with the full technical
            context needed to resolve it — screen, user, device, OS build, error
            domain, and message. iOS client errors carry the richest detail;
            click a row to expand. No third-party error SDK is required.
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

      <ImportsBreakdown />

      <div className="mt-6 flex flex-wrap gap-2">
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
            {s === "all" ? "All" : (SOURCE_LABEL[s] ?? s)}
          </button>
        ))}
      </div>

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
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Screen</th>
              <th className="px-4 py-3 font-medium">When</th>
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
                  No errors recorded.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const key = `${row.source}-${row.id}`;
                const isOpen = expandedId === key;
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
                              sourceTone(row.source),
                            )}
                          >
                            {SOURCE_LABEL[row.source] ?? row.source}
                          </span>
                          {row.severity ? (
                            <span
                              className={cn(
                                "w-fit rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
                                severityTone(row.severity),
                              )}
                            >
                              {row.severity}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        <div className="line-clamp-2 max-w-md break-words">
                          {row.message}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {row.userName ?? (row.userId ? `${row.userId.slice(0, 8)}…` : "—")}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {row.screen ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                        {fmtDate(row.at)}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <td />
                        <td colSpan={5} className="px-4 py-4">
                          <dl className="space-y-2">
                            <DetailRow label="Error ID" value={row.id} />
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
                            <DetailRow label="Timestamp" value={fmtDate(row.at)} />
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

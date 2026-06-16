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
};

type ErrorsResponse = { errors: ErrorRow[] };

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

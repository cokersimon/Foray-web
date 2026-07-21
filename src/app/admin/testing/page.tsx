"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import {
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Info,
  ListChecks,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  X,
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
 *     with screenshot thumbnails, kind/detail chips, quick Resolve/Dismiss, and severity
 *     override (the traffic light — Simon's call beats the AI's, see testing.setSeverity).
 *
 * The Ask AI panel is filter-aware: it sends whatever rows are currently in view (plus their
 * screenshots) to Gemini for analysis. AI never auto-runs Cursor and never auto-sends
 * anything — every output here is a document, an answer, or a clipboard payload.
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
  severityLockedAt: number | null;
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
  severityLockedAt: number | null;
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

const KINDS = [
  "design",
  "bug",
  "content",
  "checkout",
  "suggestion",
  "account",
  "notifications",
  "accessibility",
  "performance",
  "import",
  "other",
] as const;

const KIND_LABELS: Record<(typeof KINDS)[number], string> = {
  design: "Design",
  bug: "Bug",
  content: "Content",
  checkout: "Checkout",
  suggestion: "Suggestion",
  account: "Account",
  notifications: "Notifications",
  accessibility: "Accessibility",
  performance: "Performance",
  import: "Import",
  other: "Other",
};

const ROW_STATUSES = ["open", "triaged", "resolved", "dismissed"] as const;
const CLUSTER_STATUSES = ["open", "briefed", "fixing", "resolved"] as const;
const SEVERITIES = ["critical", "high", "medium", "low"] as const;

function kindLabel(kind: string | null): string {
  if (!kind) return "";
  if ((KINDS as readonly string[]).includes(kind)) {
    return KIND_LABELS[kind as (typeof KINDS)[number]];
  }
  return kind;
}

function fmtDateShort(ms: number | string | null | undefined): string {
  // chef-admin now coerces bigint timestamps, but stay defensive: postgres.js
  // returns int8 as strings, and NaN renders as "Invalid Date".
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Date(n).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Traffic-light ordering: red first (critical, high), then amber, then green. */
function severityRank(severity: string | null): number {
  switch (severity) {
    case "critical": return 0;
    case "high": return 1;
    case "medium": return 2;
    case "low": return 3;
    default: return 4;
  }
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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-neutral-100 text-neutral-400 border-neutral-200";
  }
}

function severityDotClass(severity: string | null): string {
  switch (severity) {
    case "critical": return "bg-red-600";
    case "high": return "bg-red-400";
    case "medium": return "bg-amber-400";
    case "low": return "bg-emerald-500";
    default: return "bg-neutral-300";
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
    case "suggestion":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "account":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "notifications":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "accessibility":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "performance":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "import":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
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

function SeverityChip({ severity, locked }: { severity: string | null; locked?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase",
        severityTone(severity),
      )}
      title={locked ? "Severity set manually — the AI sweep won't change it" : "Severity judged by the AI sweep"}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", severityDotClass(severity))} />
      {severity ?? "—"}
      {locked ? <span className="normal-case opacity-70">· you</span> : null}
    </span>
  );
}

/** The traffic-light override: four buttons calling testing.setSeverity. */
function SeverityPicker({
  current,
  disabled,
  onPick,
}: {
  current: string | null;
  disabled: boolean;
  onPick: (severity: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1 text-[11px] uppercase tracking-wider text-neutral-400">Severity</span>
      {SEVERITIES.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled || current === s}
          onClick={(e) => {
            e.stopPropagation();
            onPick(s);
          }}
          className={cn(
            "flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed",
            current === s
              ? cn("border-transparent", severityTone(s))
              : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40",
          )}
        >
          <span className={cn("h-2 w-2 rounded-full", severityDotClass(s))} />
          {s}
        </button>
      ))}
    </div>
  );
}

export default function TestingPage() {
  const { data, error, isLoading, refetch } = useChefQuery<TestingResponse>(
    "testing.list",
    {},
    { pollMs: 30000 },
  );

  const clusters = useMemo(() => data?.clusters ?? [], [data]);
  const feedback = useMemo(() => data?.feedback ?? [], [data]);
  const [tab, setTab] = useState<"clusters" | "reports">("clusters");
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [digest, setDigest] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Reports filters live at page level so the Ask AI panel knows exactly what's in view.
  const [status, setStatus] = useState<string>("open");
  const [kind, setKind] = useState<string>("all");
  const [screen, setScreen] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const visibleReports = useMemo(() => {
    const filtered = feedback.filter(
      (f) =>
        (status === "all" || f.status === status) &&
        (kind === "all" || f.kind === kind) &&
        (screen === "all" || f.screenId === screen) &&
        (severityFilter === "all" || f.severity === severityFilter),
    );
    // Red first, newest first within a band.
    return filtered.sort(
      (a, b) => severityRank(a.severity) - severityRank(b.severity) || b.createdAt - a.createdAt,
    );
  }, [feedback, status, kind, screen, severityFilter]);

  const chatContext = useMemo(() => {
    if (tab === "reports") {
      const parts = [
        status !== "all" ? status : null,
        kind !== "all" ? kindLabel(kind) : null,
        screen !== "all" ? screen : null,
        severityFilter !== "all" ? severityFilter : null,
      ].filter(Boolean);
      return {
        ids: visibleReports.map((r) => r.id),
        label: `Reports tab — ${visibleReports.length} report${visibleReports.length === 1 ? "" : "s"} in view${parts.length ? ` (filtered: ${parts.join(" · ")})` : ""}`,
      };
    }
    const openClusters = clusters.filter((c) => c.status !== "resolved");
    const memberIds = feedback
      .filter((f) => f.clusterId && openClusters.some((c) => c.id === f.clusterId))
      .map((f) => f.id);
    return {
      ids: memberIds,
      label: `Clusters tab — ${openClusters.length} unresolved issue${openClusters.length === 1 ? "" : "s"} (${memberIds.length} underlying reports)`,
    };
  }, [tab, visibleReports, clusters, feedback, status, kind, screen, severityFilter]);

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
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Testing</h1>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
              aria-label="How this page works"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Beta reports from the in-app shake reporter, clustered into issues by AI. You triage —
            AI drafts and advises.
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

      {showInfo ? <InfoPanel onClose={() => setShowInfo(false)} /> : null}

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
        <ReportsTable
          feedback={feedback}
          rows={visibleReports}
          isLoading={isLoading}
          busy={busy}
          run={run}
          status={status}
          setStatus={setStatus}
          kind={kind}
          setKind={setKind}
          screen={screen}
          setScreen={setScreen}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
        />
      )}

      <ChatPanel contextLabel={chatContext.label} feedbackIds={chatContext.ids} />
    </div>
  );
}

// ── Info panel — what every control on this page does ────────────────────────────────────

function InfoPanel({ onClose }: { onClose: () => void }) {
  const items: Array<{ title: string; body: string }> = [
    {
      title: "How reports arrive",
      body: "Testers shake the phone in a TestFlight build → the app freezes a screenshot and opens the report form. Reports queue offline on the device and flush when the app next has signal.",
    },
    {
      title: "Clusters vs Reports",
      body: "Reports is the raw feed — one row per submission. Clusters is the issues view: the AI sweep groups reports that describe the same underlying problem, so five people reporting one broken button is one cluster, not five rows.",
    },
    {
      title: "Run sweep",
      body: "Manually runs the AI enrich pass: it summarises each new report, judges severity, and files it into a cluster. It also runs automatically every 20 minutes, and immediately when a report arrives — you rarely need this button.",
    },
    {
      title: "What to Test",
      body: "Drafts TestFlight release-note lines from clusters you've marked resolved with a fixed-in build. Copy-paste into App Store Connect — never sent automatically.",
    },
    {
      title: "Refresh",
      body: "Re-fetches the queue (it also auto-refreshes every 30 seconds).",
    },
    {
      title: "Severity (traffic light)",
      body: "The AI judges each report: critical/high = red (blocks a flow, crash, payment, data loss), medium = amber (annoying but usable), low = green (cosmetic). You can override it on any row or cluster — your setting is locked and the AI never changes it back. Work red-first.",
    },
    {
      title: "Report statuses",
      body: "Open = untouched · Triaged = seen, on your list · Resolved = fixed (your \"complete\") · Dismissed = ignore, won't fix. Quick ✓/⃠ buttons on each row resolve/dismiss without expanding.",
    },
    {
      title: "Cluster statuses",
      body: "Open → Briefed (a Cursor brief is drafted) → Fixing → Resolved. Resolving a cluster resolves its member reports. Add a \"fixed in build\" so What to Test can cite it.",
    },
    {
      title: "Draft brief / Copy reporter emails",
      body: "Draft brief writes a Cursor build brief from the cluster's reports + screenshots for you to edit and hand over. Copy reporter emails collects the signed-in reporters' addresses for a thank-you when the fix ships.",
    },
    {
      title: "Ask AI (bottom panel)",
      body: "Chat about exactly what's in view: it sees the rows matching your current tab + filters, their comments and screenshots. Filter to e.g. open design reports on one screen, then ask for a diagnosis or a suggested fix. It only advises — you triage.",
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

// ── Ask AI — filter-aware triage chat (advisory only) ────────────────────────────────────

type ChatMessage = { role: "user" | "assistant"; text: string };

function ChatPanel({ contextLabel, feedbackIds }: { contextLabel: string; feedbackIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const question = input.trim();
    if (!question || sending) return;
    if (feedbackIds.length === 0) {
      setChatError("Nothing in view — adjust the filters so there's at least one report to analyse.");
      return;
    }
    setChatError(null);
    setSending(true);
    setInput("");
    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    try {
      const res = await chefAdmin<{ answer: string; reportCount: number; screenshotCount: number }>(
        "testing.chat",
        {
          question,
          feedbackIds,
          contextLabel,
          history,
        },
      );
      setMessages((prev) => [...prev, { role: "assistant", text: res.answer }]);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Chat failed");
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-neutral-50"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
          <MessageCircle className="h-4 w-4 text-violet-500" /> Ask AI about this view
        </span>
        <span className="flex items-center gap-3">
          <span className="hidden text-xs text-neutral-400 sm:block">{contextLabel}</span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-neutral-400" />
          )}
        </span>
      </button>

      {open ? (
        <div className="border-t border-neutral-100">
          <div className="bg-violet-50/50 px-4 py-2 text-xs text-violet-700">
            AI sees: {contextLabel}. It reads those reports&rsquo; comments, metadata and up to 6
            screenshots. Advisory only — it can&rsquo;t change anything.
          </div>

          {messages.length > 0 ? (
            <div ref={scrollRef} className="max-h-96 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "ml-auto bg-neutral-900 text-white"
                      : "bg-neutral-100 text-neutral-800",
                  )}
                >
                  {m.text}
                </div>
              ))}
              {sending ? (
                <div className="max-w-[85%] rounded-xl bg-neutral-100 px-3 py-2 text-sm text-neutral-400">
                  Analysing {feedbackIds.length} report{feedbackIds.length === 1 ? "" : "s"}…
                </div>
              ) : null}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-neutral-400">
              e.g. &ldquo;Summarise what testers are hitting&rdquo; · &ldquo;What&rsquo;s the likely
              root cause of these design reports?&rdquo; · &ldquo;Which of these should I fix
              first?&rdquo;
            </div>
          )}

          {chatError ? (
            <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {chatError}
            </div>
          ) : null}

          <div className="flex items-end gap-2 border-t border-neutral-100 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder="Ask about the reports currently in view…"
              className="min-h-[2.5rem] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-800 focus:border-neutral-400 focus:outline-none"
            />
            <button
              type="button"
              disabled={sending || !input.trim()}
              onClick={() => void send()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition-opacity disabled:opacity-30"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
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
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [buildInput, setBuildInput] = useState("");
  const [briefOpenId, setBriefOpenId] = useState<string | null>(null);

  const rows = clusters
    .filter(
      (c) =>
        (showResolved || c.status !== "resolved") &&
        (severityFilter === "all" || c.severity === severityFilter),
    )
    .sort(
      (a, b) => severityRank(a.severity) - severityRank(b.severity) || b.lastModified - a.lastModified,
    );

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {["all", ...SEVERITIES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverityFilter(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              severityFilter === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {s !== "all" ? <span className={cn("h-2 w-2 rounded-full", severityDotClass(s))} /> : null}
            {s}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-neutral-200" />
        <label className="flex w-fit items-center gap-2 text-xs text-neutral-500">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
          />
          Show resolved
        </label>
      </div>

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
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                  No clusters yet — they appear once the enrich sweep has processed the first
                  reports (on report arrival, every 20 minutes, or Run sweep above).
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
                          {cluster.kind ? <Chip tone={kindTone(cluster.kind)}>{kindLabel(cluster.kind)}</Chip> : null}
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
                        <SeverityChip severity={cluster.severity} locked={cluster.severityLockedAt != null} />
                      </td>
                      <td className="px-4 py-3">
                        <Chip tone={statusTone(cluster.status)}>{cluster.status}</Chip>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-500">
                        {fmtDateShort(cluster.lastModified)}
                      </td>
                      <td className="px-4 py-3">
                        {cluster.status !== "resolved" ? (
                          <button
                            type="button"
                            disabled={busy != null}
                            title="Mark resolved"
                            onClick={(e) => {
                              e.stopPropagation();
                              void run(`cluster-quick-${cluster.id}`, async () => {
                                await chefAdmin("testing.setStatus", {
                                  clusterId: cluster.id,
                                  status: "resolved",
                                });
                              });
                            }}
                            className="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        ) : null}
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <td />
                        <td colSpan={6} className="px-4 py-4">
                          {cluster.summary ? (
                            <p className="mb-3 max-w-3xl text-sm text-neutral-600">{cluster.summary}</p>
                          ) : null}

                          <div className="mb-3">
                            <SeverityPicker
                              current={cluster.severity}
                              disabled={busy != null}
                              onPick={(s) =>
                                void run(`cluster-sev-${cluster.id}`, async () => {
                                  await chefAdmin("testing.setSeverity", {
                                    clusterId: cluster.id,
                                    severity: s,
                                  });
                                })
                              }
                            />
                          </div>

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
  rows,
  isLoading,
  busy,
  run,
  status,
  setStatus,
  kind,
  setKind,
  screen,
  setScreen,
  severityFilter,
  setSeverityFilter,
}: {
  feedback: FeedbackRow[];
  rows: FeedbackRow[];
  isLoading: boolean;
  busy: string | null;
  run: (key: string, work: () => Promise<void>) => Promise<void>;
  status: string;
  setStatus: (s: string) => void;
  kind: string;
  setKind: (k: string) => void;
  screen: string;
  setScreen: (s: string) => void;
  severityFilter: string;
  setSeverityFilter: (s: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const screens = Array.from(new Set(feedback.map((f) => f.screenId).filter(Boolean))) as string[];

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
        {["all", ...SEVERITIES].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeverityFilter(s)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
              severityFilter === s
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {s !== "all" ? <span className={cn("h-2 w-2 rounded-full", severityDotClass(s))} /> : null}
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
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              kind === k
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {k === "all" ? "all" : kindLabel(k)}
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
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
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
                          <Chip tone={kindTone(row.kind)}>{kindLabel(row.kind)}</Chip>
                          {row.detail ? (
                            <Chip tone="bg-neutral-100 text-neutral-600 border-neutral-200">
                              {row.detail}
                            </Chip>
                          ) : null}
                          <SeverityChip severity={row.severity} locked={row.severityLockedAt != null} />
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {row.status !== "resolved" ? (
                            <button
                              type="button"
                              disabled={busy != null}
                              title="Mark resolved (complete)"
                              onClick={(e) => {
                                e.stopPropagation();
                                void run(`row-quick-${row.id}`, async () => {
                                  await chefAdmin("testing.setStatus", {
                                    feedbackId: row.id,
                                    status: "resolved",
                                  });
                                });
                              }}
                              className="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          ) : null}
                          {row.status !== "dismissed" ? (
                            <button
                              type="button"
                              disabled={busy != null}
                              title="Dismiss (ignore)"
                              onClick={(e) => {
                                e.stopPropagation();
                                void run(`row-quick-${row.id}`, async () => {
                                  await chefAdmin("testing.setStatus", {
                                    feedbackId: row.id,
                                    status: "dismissed",
                                  });
                                });
                              }}
                              className="rounded-lg border border-neutral-200 p-1.5 text-neutral-400 transition-colors hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-40"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr className="border-b border-neutral-100 bg-neutral-50/60">
                        <td />
                        <td colSpan={6} className="px-4 py-4">
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
                            <span className="mx-1 h-5 w-px bg-neutral-200" />
                            <SeverityPicker
                              current={row.severity}
                              disabled={busy != null}
                              onPick={(s) =>
                                void run(`row-sev-${row.id}`, async () => {
                                  await chefAdmin("testing.setSeverity", {
                                    feedbackId: row.id,
                                    severity: s,
                                  });
                                })
                              }
                            />
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

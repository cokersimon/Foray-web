"use client";

import { RefreshCw } from "lucide-react";
import { useChefQuery } from "@/lib/use-chef-query";

type Analytics = {
  signups: { total: number; last7d: number; last30d: number };
  imports: { total: number; ready: number; failed: number; last7d: number };
  checkout: {
    sessions: number;
    handedOff: number;
    confirmed: number;
    abandoned: number;
    failed: number;
    orders: number;
  };
  errors: { last24h: number; last7d: number; ratePct: number };
  ai: { calls: number; costEstimateGbp: string };
};

type AnalyticsResponse = { metrics: Analytics };

type PepestoCredits = {
  creditsRemaining: number;
  currency: string;
  checkedAt: number;
};

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

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-neutral-400">
        {label}
      </div>
      <div
        className={
          tone === "warn"
            ? "mt-2 text-3xl font-bold text-red-600"
            : "mt-2 text-3xl font-bold text-neutral-900"
        }
      >
        {value}
      </div>
      {sub ? <div className="mt-1 text-xs text-neutral-500">{sub}</div> : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const {
    data,
    error,
    isLoading,
    refetch: refetchAnalytics,
  } = useChefQuery<AnalyticsResponse>("analytics.overview", {}, { pollMs: 60000 });
  const {
    data: credits,
    error: creditsError,
    isLoading: creditsLoading,
    refetch: refetchCredits,
  } = useChefQuery<PepestoCredits>("pepesto.credits", {}, { pollMs: 15000 });
  const m = data?.metrics;

  const refreshAll = () => {
    refetchAnalytics();
    refetchCredits();
  };

  const creditsTone =
    credits && credits.creditsRemaining < 5 ? ("warn" as const) : ("default" as const);
  const checkedLabel = credits
    ? `Live from Pepesto · updated ${new Date(credits.checkedAt).toLocaleTimeString("en-GB")}`
    : "Live from Pepesto /credits";

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Analytics
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            SQL-derived metrics over data you already have — signups, imports,
            the checkout funnel, AI usage, and an error-rate signal — plus a live
            Pepesto prepaid credit balance. No analytics SDK is installed; these
            are server-side counts only.
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Couldn&rsquo;t load analytics: {error}. This view needs the{" "}
          <code className="rounded bg-amber-100 px-1">analytics.overview</code>{" "}
          chef-admin action deployed.
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Integrations
        </h2>
        {creditsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Couldn&rsquo;t load Pepesto credits: {creditsError}. Needs{" "}
            <code className="rounded bg-amber-100 px-1">pepesto.credits</code>{" "}
            on chef-admin plus a configured{" "}
            <code className="rounded bg-amber-100 px-1">PEPESTO_API_KEY</code>.
          </div>
        ) : creditsLoading && !credits ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-8 text-center text-neutral-400">
            Loading Pepesto balance…
          </div>
        ) : credits ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat
              label="Pepesto credits remaining"
              value={formatCredits(credits.creditsRemaining, credits.currency)}
              sub={checkedLabel}
              tone={creditsTone}
            />
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center text-neutral-400">
          Loading…
        </div>
      ) : m ? (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Growth
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat
                label="Signups"
                value={m.signups.total}
                sub={`${m.signups.last7d} in last 7d · ${m.signups.last30d} in 30d`}
              />
              <Stat
                label="Imports"
                value={m.imports.total}
                sub={`${m.imports.ready} ready · ${m.imports.failed} failed`}
              />
              <Stat
                label="AI calls"
                value={m.ai.calls}
                sub={`~£${m.ai.costEstimateGbp} estimated`}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Checkout funnel
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat label="Sessions" value={m.checkout.sessions} />
              <Stat
                label="Handed off"
                value={m.checkout.handedOff}
                sub="reached the retailer"
              />
              <Stat
                label="Confirmed"
                value={m.checkout.confirmed}
                sub="self-attested done"
              />
              <Stat label="Abandoned" value={m.checkout.abandoned} sub="30-min timeout" />
              <Stat label="Failed" value={m.checkout.failed} />
              <Stat label="Orders" value={m.checkout.orders} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
              Reliability
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Stat
                label="Errors (24h)"
                value={m.errors.last24h}
                tone={m.errors.last24h > 0 ? "warn" : "default"}
              />
              <Stat label="Errors (7d)" value={m.errors.last7d} />
              <Stat
                label="Error rate"
                value={`${m.errors.ratePct}%`}
                sub="errors vs imports + checkouts (7d)"
                tone={m.errors.ratePct >= 5 ? "warn" : "default"}
              />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { AlertTriangle, RefreshCw, ShieldAlert } from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";

type Report = {
  id: string;
  createdAt: number;
  userId: string;
  targetType: string;
  targetId: string;
  reason: string;
  note: string | null;
  status: string;
  recipeTitle: string | null;
};

type ReportsResponse = { reports: Report[] };

const STATUSES = ["open", "triaged", "resolved", "dismissed"] as const;
const REASON_LABEL: Record<string, string> = {
  broken: "Broken",
  incorrect_ingredients_directions: "Incorrect ingredients / directions",
  incorrect_scaling_units: "Incorrect scaling / units",
  safety_allergen: "Safety / allergen",
  other: "Other",
};

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: string): string {
  switch (status) {
    case "open":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "triaged":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "resolved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-neutral-100 text-neutral-500 border-neutral-200";
  }
}

export default function ReportsPage() {
  const { data, error, isLoading, refetch } = useChefQuery<ReportsResponse>(
    "reports.list",
    {},
    { pollMs: 30000 },
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reports = [...(data?.reports ?? [])].sort((a, b) => {
    const aAllergen = a.reason === "safety_allergen" ? 1 : 0;
    const bAllergen = b.reason === "safety_allergen" ? 1 : 0;
    if (aAllergen !== bAllergen) return bAllergen - aAllergen;
    return b.createdAt - a.createdAt;
  });

  const setStatus = async (reportId: string, status: string) => {
    setBusyId(reportId);
    setActionError(null);
    try {
      await chefAdmin("reports.setStatus", { reportId, status });
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const unpublishRecipe = async (report: Report) => {
    if (
      !window.confirm(
        `Unpublish "${report.recipeTitle ?? report.targetId}"? It is archived in the app (existing plans keep working, Explore hides it). Use this for a verified allergen-safety report.`,
      )
    ) {
      return;
    }
    setBusyId(report.id);
    setActionError(null);
    try {
      await chefAdmin("reports.unpublishRecipe", { recipeId: report.targetId });
      await chefAdmin("reports.setStatus", { reportId: report.id, status: "resolved" });
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Unpublish failed");
    } finally {
      setBusyId(null);
    }
  };

  const allergenCount = reports.filter(
    (r) => r.reason === "safety_allergen" && r.status === "open",
  ).length;

  return (
    <div className="p-8 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Reports
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            User-filed reports of concern. Allergen-safety reports float to the
            top. A single unverified report never auto-unpublishes — review,
            then unpublish manually if warranted.
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

      {allergenCount > 0 ? (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <strong>{allergenCount}</strong> open allergen-safety report
          {allergenCount === 1 ? "" : "s"} needing review.
        </div>
      ) : null}

      {actionError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Couldn&rsquo;t load reports: {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center text-neutral-400">
            Loading…
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-12 text-center text-neutral-400">
            No reports.
          </div>
        ) : (
          reports.map((report) => {
            const isAllergen = report.reason === "safety_allergen";
            return (
              <div
                key={report.id}
                className={cn(
                  "rounded-2xl border bg-white p-4",
                  isAllergen
                    ? "border-red-300 ring-1 ring-red-100"
                    : "border-neutral-200",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {isAllergen ? (
                    <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      <AlertTriangle className="h-3 w-3" /> Allergen
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-neutral-900">
                    {REASON_LABEL[report.reason] ?? report.reason}
                  </span>
                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-500">
                    {report.targetType}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-medium",
                      statusTone(report.status),
                    )}
                  >
                    {report.status}
                  </span>
                  <span className="ml-auto text-xs text-neutral-400">
                    {fmtDate(report.createdAt)}
                  </span>
                </div>

                {report.recipeTitle ? (
                  <p className="mt-2 text-sm text-neutral-700">
                    Recipe: <span className="font-medium">{report.recipeTitle}</span>
                  </p>
                ) : null}
                {report.note ? (
                  <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                    {report.note}
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-[11px] text-neutral-400">
                  target {report.targetId} · user {report.userId.slice(0, 8)}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busyId === report.id || report.status === s}
                      onClick={() => setStatus(report.id, s)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                        report.status === s
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                  {isAllergen && report.targetType === "recipe" ? (
                    <button
                      type="button"
                      disabled={busyId === report.id}
                      onClick={() => unpublishRecipe(report)}
                      className="ml-auto rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      Unpublish recipe
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

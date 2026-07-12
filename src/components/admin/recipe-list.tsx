"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AlertCircle,
  ChefHat,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

type RecipeStatus = "ready_for_review" | "approved" | "published";

interface StagingRecipeSummary {
  _id: string;
  name: string;
  status: string;
  source: string;
  heroImageUrl?: string;
  tagsMealType?: string[];
  expectedCalories?: number;
  computedCalories?: number;
  createdAt: number;
}

export type IngestJobCard = {
  id: string;
  status: "queued" | "running" | "error";
  stage: string | null;
  error: string | null;
  createdAt: number;
};

const statusTabs: { label: string; value: RecipeStatus }[] = [
  { label: "Review", value: "ready_for_review" },
  { label: "Approved", value: "approved" },
  { label: "Published", value: "published" },
];

interface RecipeListProps {
  recipes: StagingRecipeSummary[] | undefined;
  selectedId: string | null;
  onSelect: (id: string) => void;
  statusFilter: RecipeStatus;
  onStatusChange: (status: RecipeStatus) => void;
  onDeleteStagingRecipe: (id: string) => void | Promise<void>;
  deletingStagingId?: string | null;
  ingestJobs?: IngestJobCard[];
  onRetryIngestJob?: (jobId: string) => void | Promise<void>;
  onDismissIngestJob?: (jobId: string) => void | Promise<void>;
  ingestJobActionId?: string | null;
}

export function RecipeList({
  recipes,
  selectedId,
  onSelect,
  statusFilter,
  onStatusChange,
  onDeleteStagingRecipe,
  deletingStagingId = null,
  ingestJobs = [],
  onRetryIngestJob,
  onDismissIngestJob,
  ingestJobActionId = null,
}: RecipeListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery("");
  }, [statusFilter]);

  const displayCalories = (recipe: StagingRecipeSummary): number | null => {
    const computed =
      typeof recipe.computedCalories === "number" &&
      Number.isFinite(recipe.computedCalories) &&
      recipe.computedCalories > 0
        ? recipe.computedCalories
        : null;
    const expected =
      typeof recipe.expectedCalories === "number" &&
      Number.isFinite(recipe.expectedCalories) &&
      recipe.expectedCalories > 0
        ? recipe.expectedCalories
        : null;
    return computed ?? expected;
  };

  const filteredRecipes = useMemo(() => {
    if (!recipes) return undefined;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => r.name.toLowerCase().includes(q));
  }, [recipes, searchQuery]);

  const showJobCards =
    statusFilter === "ready_for_review" && ingestJobs.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Status tabs */}
      <div className="flex gap-1 border-b border-neutral-200 px-4 pt-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-700 hover:text-neutral-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="border-b border-neutral-200 px-4 py-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes by name…"
            className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            aria-label="Search recipes by name"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Recipe list */}
      <div className="flex-1 overflow-y-auto p-2">
        {showJobCards ? (
          <div className="mb-2 space-y-1">
            {ingestJobs.map((job) => {
              const busy = ingestJobActionId === job.id;
              const isError = job.status === "error";
              return (
                <div
                  key={job.id}
                  className={cn(
                    "rounded-xl border px-3 py-2.5",
                    isError
                      ? "border-red-200 bg-red-50"
                      : "border-neutral-200 bg-white",
                  )}
                >
                  <div className="flex items-start gap-2">
                    {isError ? (
                      <AlertCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                        aria-hidden
                      />
                    ) : (
                      <Loader2
                        className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-neutral-500"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-sm font-semibold",
                          isError ? "text-red-900" : "text-neutral-900",
                        )}
                      >
                        {isError ? "Ingest failed" : "Processing with AI…"}
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 text-xs",
                          isError ? "text-red-700" : "text-neutral-600",
                        )}
                      >
                        {isError
                          ? (job.error ?? "Unknown error")
                          : job.stage
                            ? `Stage: ${job.stage}`
                            : job.status === "queued"
                              ? "Queued"
                              : "Running"}
                      </div>
                      {isError && (onRetryIngestJob || onDismissIngestJob) ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {onRetryIngestJob ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onRetryIngestJob(job.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-2.5 py-1 text-xs font-semibold text-red-800 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {busy ? (
                                <Loader2
                                  className="h-3 w-3 animate-spin"
                                  aria-hidden
                                />
                              ) : (
                                <RefreshCw className="h-3 w-3" aria-hidden />
                              )}
                              Try again
                            </button>
                          ) : null}
                          {onDismissIngestJob ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void onDismissIngestJob(job.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Dismiss
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {filteredRecipes === undefined ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-700">
            Loading recipes...
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-700">
            <ChefHat className="mb-2 h-8 w-8 text-neutral-500" />
            <span className="text-sm">
              {searchQuery.trim()
                ? "No recipes match"
                : "No recipes in this status"}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRecipes.map((recipe) => {
              const calories = displayCalories(recipe);
              return (
                <div
                  key={recipe._id}
                  className={cn(
                    "flex w-full items-center gap-1 rounded-xl px-2 py-2 transition-colors",
                    selectedId === recipe._id
                      ? "bg-neutral-100"
                      : "hover:bg-neutral-50",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(recipe._id)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left"
                  >
                    {recipe.heroImageUrl ? (
                      <img
                        src={recipe.heroImageUrl}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <ChefHat className="h-4 w-4 text-neutral-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-neutral-900">
                        {recipe.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-neutral-800">
                        <span>{recipe.source}</span>
                        {calories != null && (
                          <>
                            <span className="text-neutral-500" aria-hidden>
                              &middot;
                            </span>
                            <span>{Math.round(calories)} kcal</span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void onDeleteStagingRecipe(String(recipe._id));
                    }}
                    disabled={
                      deletingStagingId != null &&
                      String(deletingStagingId) === String(recipe._id)
                    }
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Delete staging recipe"
                    aria-label={`Delete ${recipe.name}`}
                  >
                    {deletingStagingId != null &&
                    String(deletingStagingId) === String(recipe._id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

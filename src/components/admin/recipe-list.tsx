"use client";

import { cn } from "@/lib/cn";
import { ChefHat, Loader2, Trash2 } from "lucide-react";

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
}

export function RecipeList({
  recipes,
  selectedId,
  onSelect,
  statusFilter,
  onStatusChange,
  onDeleteStagingRecipe,
  deletingStagingId = null,
}: RecipeListProps) {
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

      {/* Recipe list */}
      <div className="flex-1 overflow-y-auto p-2">
        {recipes === undefined ? (
          <div className="flex items-center justify-center py-12 text-sm text-neutral-700">
            Loading recipes...
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-700">
            <ChefHat className="mb-2 h-8 w-8 text-neutral-500" />
            <span className="text-sm">No recipes in this status</span>
          </div>
        ) : (
          <div className="space-y-1">
            {recipes.map((recipe) => {
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

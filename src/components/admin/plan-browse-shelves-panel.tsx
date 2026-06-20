"use client";

import { cn } from "@/lib/cn";
import {
  planBrowseShelvesForRecipe,
  stagingRecipeForPlanShelves,
  type PlanBrowseShelfMatch,
} from "@/lib/plan-browse-shelves";

type Props = {
  recipe: {
    status?: string;
    recipeData?: Record<string, unknown>;
    computedProtein?: number;
    expectedProtein?: number;
  };
  /** Dark preview chrome vs light editor chrome. */
  variant?: "light" | "dark";
};

function ShelfChip({
  shelf,
  variant,
}: {
  shelf: PlanBrowseShelfMatch;
  variant: "light" | "dark";
}) {
  const isTrending = shelf.kind === "trending";
  return (
    <span
      title={shelf.note}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        variant === "dark"
          ? isTrending
            ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
            : shelf.derived
              ? "border-white/15 bg-white/5 text-neutral-300"
              : "border-violet-400/40 bg-violet-500/15 text-violet-100"
          : isTrending
            ? "border-sky-300 bg-sky-50 text-sky-900"
            : shelf.derived
              ? "border-neutral-200 bg-neutral-50 text-neutral-700"
              : "border-violet-300 bg-violet-50 text-violet-900",
      )}
    >
      {shelf.title}
      {shelf.derived ? (
        <span
          className={cn(
            "ml-1 text-[9px] font-normal uppercase tracking-wide",
            variant === "dark" ? "text-neutral-500" : "text-neutral-400",
          )}
        >
          auto
        </span>
      ) : null}
    </span>
  );
}

/** Mirrors the Plan tab browse rails the consumer app renders (`RecipeShelves.swift`). */
export function PlanBrowseShelvesPanel({ recipe, variant = "light" }: Props) {
  const shelves = planBrowseShelvesForRecipe(stagingRecipeForPlanShelves(recipe));
  const trending = shelves.find((s) => s.kind === "trending");

  return (
    <div>
      <h3
        className={cn(
          "mb-1 text-xs font-semibold uppercase tracking-wider",
          variant === "dark" ? "text-neutral-400" : "text-neutral-800",
        )}
      >
        Plan browse shelves
      </h3>
      <p
        className={cn(
          "mb-2 text-[11px] leading-snug",
          variant === "dark" ? "text-neutral-500" : "text-neutral-500",
        )}
      >
        Category titles on the Plan tab — synced with the iOS app.{" "}
        <strong className={variant === "dark" ? "text-neutral-400" : "text-neutral-700"}>
          {trending?.title ?? "Trending"}
        </strong>{" "}
        is derived from ratings, not a Chef tag.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {shelves.map((shelf) => (
          <ShelfChip key={shelf.id} shelf={shelf} variant={variant} />
        ))}
      </div>
      {trending?.note ? (
        <p
          className={cn(
            "mt-2 text-[10px] leading-snug",
            variant === "dark" ? "text-neutral-600" : "text-neutral-500",
          )}
        >
          {trending.note}
        </p>
      ) : null}
    </div>
  );
}

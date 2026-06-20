/**
 * Plan tab browse shelf titles + eligibility — keep in sync with iOS `RecipeShelves.swift`
 * and ADR-018 (derived facets are computed, never stored or tagged in admin).
 */

export const PLAN_SHELF_TRENDING = "Trending";
export const PLAN_SHELF_QUICK = "Under 30 min";
export const PLAN_SHELF_HIGH_PROTEIN = "High-Protein";

/** Dish-type rails on Plan home — order matches iOS `RecipeShelf.all`. */
export const PLAN_DISH_TYPE_SHELVES = [
  "dinner",
  "breakfast",
  "pasta",
  "curry",
  "salad",
] as const;

const DISH_TYPE_TITLES: Record<(typeof PLAN_DISH_TYPE_SHELVES)[number], string> = {
  dinner: "Dinner",
  breakfast: "Breakfast",
  pasta: "Pasta",
  curry: "Curry",
  salad: "Salad",
};

export type PlanBrowseShelfMatch = {
  id: string;
  title: string;
  kind: "trending" | "quick" | "highProtein" | "dishType";
  /** Not a Chef tag — computed at query time in the app (ADR-018). */
  derived?: boolean;
  note?: string;
};

export type StagingRecipeForShelves = {
  tags?: string[];
  prepSec?: number | null;
  cookSec?: number | null;
  macros?: { protein?: number | null } | null;
  ingredients?: Array<{
    schemaVersion?: number;
    aisle?: string;
    lineMacros?: unknown;
  }>;
  status?: string;
};

const HIGH_PROTEIN_MIN_G = 30;
const THIRTY_MIN_SEC = 30 * 60;

function totalSec(recipe: StagingRecipeForShelves): number {
  return (recipe.prepSec ?? 0) + (recipe.cookSec ?? 0);
}

function hasFullMacroCoverage(
  ingredients?: StagingRecipeForShelves["ingredients"],
): boolean {
  if (!ingredients?.length) return false;
  return ingredients.every(
    (line) =>
      line.schemaVersion != null || (line.aisle?.trim().length ?? 0) > 0,
  );
}

/** Which Plan browse rails this global recipe appears on once in the catalog. */
export function planBrowseShelvesForRecipe(
  recipe: StagingRecipeForShelves,
): PlanBrowseShelfMatch[] {
  const shelves: PlanBrowseShelfMatch[] = [];
  const tags = new Set((recipe.tags ?? []).map((t) => t.trim().toLowerCase()));
  const published = recipe.status === "published";

  shelves.push({
    id: "trending",
    title: PLAN_SHELF_TRENDING,
    kind: "trending",
    derived: true,
    note: published
      ? "First Plan browse rail — ranked by community ratings in the app."
      : "First Plan browse rail once published — ranked by ratings (fresh meals appear here until rated).",
  });

  if (totalSec(recipe) > 0 && totalSec(recipe) <= THIRTY_MIN_SEC) {
    shelves.push({
      id: "quick",
      title: PLAN_SHELF_QUICK,
      kind: "quick",
      derived: true,
    });
  }

  const protein = recipe.macros?.protein;
  if (
    protein != null &&
    Number.isFinite(protein) &&
    hasFullMacroCoverage(recipe.ingredients) &&
    protein >= HIGH_PROTEIN_MIN_G
  ) {
    shelves.push({
      id: "highProtein",
      title: PLAN_SHELF_HIGH_PROTEIN,
      kind: "highProtein",
      derived: true,
    });
  }

  for (const dish of PLAN_DISH_TYPE_SHELVES) {
    if (tags.has(dish)) {
      shelves.push({
        id: `dish-${dish}`,
        title: DISH_TYPE_TITLES[dish],
        kind: "dishType",
      });
    }
  }

  return shelves;
}

/** Extract ADR-018 fields from a legacy staging detail row for shelf preview. */
export function stagingRecipeForPlanShelves(recipe: {
  status?: string;
  recipeData?: Record<string, unknown>;
  computedProtein?: number;
  expectedProtein?: number;
}): StagingRecipeForShelves {
  const data = recipe.recipeData ?? {};
  const tags = Array.isArray(data.tags)
    ? data.tags.filter((t): t is string => typeof t === "string")
    : [];
  const prepMin = typeof data.prepTime === "number" ? data.prepTime : null;
  const cookMin = typeof data.cookTime === "number" ? data.cookTime : null;
  const ingredients = Array.isArray(data.ingredients)
    ? (data.ingredients as StagingRecipeForShelves["ingredients"])
    : [];
  const protein = recipe.computedProtein ?? recipe.expectedProtein;

  return {
    tags,
    prepSec: prepMin != null ? prepMin * 60 : null,
    cookSec: cookMin != null ? cookMin * 60 : null,
    macros: protein != null ? { protein } : null,
    ingredients,
    status: recipe.status,
  };
}

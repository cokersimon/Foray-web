/**
 * Resolves recipe tag fields for admin UI. Tags may live on the Convex document
 * root (preferred) or inside `recipeData` (legacy / alternate ingest paths).
 * Multiple key spellings are accepted so badges always show when data exists.
 *
 * Cuisine is a CLOSED category that now rides the unified `tags` array (ADR-018): the Chef emits
 * cuisine into `tags`, so cuisine is classified out of `tags` against `CLOSED_CUISINES` (single
 * source = chef.taxonomy) rather than read from the legacy free-text `tagsCuisine` bucket.
 */

import { isCuisine } from "./cuisine-taxonomy";

export type ResolvedStagingTags = {
  tagsCuisine: string[];
  tagsMealType: string[];
  tagsDietary: string[];
  tagsCookSpeed: string[];
  tagsSeasonality: string[];
  computedAllergens: string[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function normalizeStringList(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const out: string[] = [];
    for (const x of value) {
      if (typeof x === "string" && x.trim()) out.push(x.trim());
    }
    return out;
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/**
 * Collects non-empty string lists from one or more objects, trying each key
 * in order. Values are de-duplicated case-insensitively while preserving first
 * casing seen.
 */
function mergeListsFromSources(
  sources: Array<Record<string, unknown> | null | undefined>,
  keys: string[],
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    if (!src) continue;
    for (const key of keys) {
      for (const s of normalizeStringList(src[key])) {
        const lower = s.toLowerCase();
        if (seen.has(lower)) continue;
        seen.add(lower);
        out.push(s);
      }
    }
  }
  return out;
}

/**
 * Reads tag arrays from the staging recipe document and nested `recipeData`.
 */
export function resolveStagingRecipeTags(recipe: unknown): ResolvedStagingTags {
  const doc = asRecord(recipe) ?? {};
  const nested = asRecord(doc.recipeData);

  const sources = [doc, nested];

  // Cuisine rides the unified `tags` array (ADR-018). Classify it out against the closed
  // vocabulary first; fall back to the legacy free-text buckets only if `tags` carried none.
  const unifiedTags = mergeListsFromSources(sources, ["tags"]);
  const cuisineFromTags = unifiedTags.filter((t) => isCuisine(t.toLowerCase()));

  return {
    tagsCuisine: cuisineFromTags.length > 0
      ? cuisineFromTags
      : mergeListsFromSources(sources, [
          "tagsCuisine",
          "tags_cuisine",
          "cuisineTags",
        ]),
    tagsMealType: mergeListsFromSources(sources, [
      "tagsMealType",
      "tags_meal_type",
      "mealTypeTags",
    ]),
    tagsDietary: mergeListsFromSources(sources, [
      "tagsDietary",
      "tags_dietary",
      "dietaryTags",
    ]),
    tagsCookSpeed: mergeListsFromSources(sources, [
      "tagsCookSpeed",
      "tags_cook_speed",
      "cookSpeed",
      "cook_speed",
    ]),
    tagsSeasonality: mergeListsFromSources(sources, [
      "tagsSeasonality",
      "tags_seasonality",
      "seasonalityTags",
    ]),
    computedAllergens: mergeListsFromSources(sources, [
      "computedAllergens",
      "computed_allergens",
    ]),
  };
}

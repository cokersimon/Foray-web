/**
 * The CLOSED cuisine vocabulary for the admin portal (ADR-018 cuisine category).
 *
 * SINGLE SOURCE INVARIANT: these ids are byte-identical to the canonical `chef.taxonomy`
 * cuisine rows (migration 20260622100000_cuisine_taxonomy.sql), which in turn match the iOS
 * `RecipeTag` cuisine cases and `OnboardingCatalog.cuisines` ids. If these four drift, a user's
 * onboarding cuisine preference can never match a Chef-emitted tag (the dead-preference bug).
 * The picker derives from this closed list — never free text — so the admin can never write a
 * cuisine the app cannot filter. Keep in lockstep with `chef.taxonomy`; the live source of truth
 * is the `taxonomy.get` admin endpoint, this constant mirrors it for offline/typed use.
 */

export const CLOSED_CUISINES = [
  "italian",
  "mexican",
  "indian",
  "chinese",
  "japanese",
  "thai",
  "french",
  "mediterranean",
  "american",
  "korean",
  "vietnamese",
  "spanish",
  "greek",
  "middle_eastern",
  "caribbean",
  "british",
] as const;

export type Cuisine = (typeof CLOSED_CUISINES)[number];

const CUISINE_SET: ReadonlySet<string> = new Set(CLOSED_CUISINES);

/** True when `value` is a member of the closed cuisine vocabulary. */
export function isCuisine(value: string): value is Cuisine {
  return CUISINE_SET.has(value);
}

/** Title-cased label for a cuisine id (e.g. `middle_eastern` -> "Middle Eastern"). */
export function cuisineLabel(value: string): string {
  return value
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** Partition a unified `tags` array into the cuisine tags (closed list) and the rest. */
export function splitCuisineTags(tags: readonly string[]): {
  cuisine: string[];
  other: string[];
} {
  const cuisine: string[] = [];
  const other: string[] = [];
  for (const tag of tags) {
    const t = tag.trim().toLowerCase();
    if (!t) continue;
    if (isCuisine(t)) cuisine.push(t);
    else other.push(tag.trim());
  }
  return { cuisine, other };
}

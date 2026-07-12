/**
 * Closed editing vocabularies for the admin recipe editor's manual tag controls.
 *
 * SINGLE SOURCE INVARIANT: these mirror the canonical `chef.taxonomy` rows (migration
 * 20260611010000_chef_schema.sql) and the 14 UK FIC allergen ids in the shared lexicon
 * (`supabase/functions/_shared/diet/allergen_lexicon.ts`). The dropdowns derive from these closed
 * lists — never free text — so an admin can never write a tag the app cannot filter or a
 * non-statutory allergen id. Keep in lockstep with the migration + lexicon (ADR-018, ADR-040).
 */

/** Meal-type / dish tags ride the unified `tags` array (dishType + method + occasion, ADR-018). */
export const MEAL_TYPE_VOCAB = [
  "breakfast",
  "brunch",
  "dinner",
  "dessert",
  "pasta",
  "curry",
  "salad",
  "soup-stew",
  "appetiser",
  "cocktail",
  "mocktail",
  "one-pot",
  "traybake",
  "air-fryer",
  "weeknight",
  "easy",
] as const;

/** Dietary labels live in `dietaryLabels`. */
export const DIETARY_VOCAB = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "nut-free",
] as const;

/** The 14 UK FIC statutory allergens, by lexicon id. Stored in `allergenFlags`. */
export const ALLERGEN_VOCAB = [
  "celery",
  "cereals_gluten",
  "crustaceans",
  "eggs",
  "fish",
  "lupin",
  "milk",
  "molluscs",
  "mustard",
  "nuts",
  "peanuts",
  "sesame",
  "soya",
  "sulphites",
] as const;

/** Human label for an allergen id (`cereals_gluten` -> "Cereals (gluten)"). */
export function allergenLabel(id: string): string {
  const labels: Record<string, string> = {
    cereals_gluten: "Cereals (gluten)",
  };
  if (labels[id]) return labels[id];
  return id.charAt(0).toUpperCase() + id.slice(1);
}

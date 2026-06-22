/**
 * Kitchen-natural quantity formatting for the admin portal — mirrors the server
 * `supabase/functions/_shared/chef/render.ts` and the app `UnitConversion`/`RecipeHydrator`.
 *
 * A fractional quantity reads as a vulgar fraction ("½ tin", "¼ tsp", "1½ tins"), never a decimal
 * ("0.5"). A noun is singular at one or below ("½ tin", "1 tin") and plural above ("1½ tins").
 * Used by the ingredient table and the phone preview so every surface shows the same wording.
 */

const VULGAR_FRACTIONS: Record<string, string> = { "0.25": "¼", "0.50": "½", "0.75": "¾" };

const NON_PLURAL_UNITS = new Set([
  "g", "kg", "mg", "oz", "lb", "ml", "l", "tsp", "tbsp",
  "fl oz", "pt", "pint", "qt", "quart", "gal", "gallon",
]);

// Generic count placeholders read as a bare number so the ingredient name carries the noun
// ("½ onion", not "½ piece"). Mirrors `GENERIC_COUNT_WORDS` in the server render.ts / Swift
// UnitConversion (ADR-051 amends ADR-046 §7).
const GENERIC_COUNT_WORDS = new Set([
  "serving", "servings", "item", "items", "whole", "each", "unit", "units",
  "piece", "pieces",
]);

/** Snap a count/measure to the nearest quarter — the granularity a kitchen works in. */
function snapQuarter(value: number): number {
  return Math.round(value * 4) / 4;
}

/** A quarter-snapped value as a natural kitchen number: whole numbers plain ("2"), fractions as
 * vulgar glyphs ("½", "1¼"). */
export function fractionString(value: number): string {
  const snapped = snapQuarter(value);
  const whole = Math.trunc(snapped);
  const frac = Number((snapped - whole).toFixed(2));
  if (frac === 0) return String(whole);
  const glyph = VULGAR_FRACTIONS[frac.toFixed(2)];
  if (!glyph) return String(snapped);
  return whole === 0 ? glyph : `${whole}${glyph}`;
}

/** Pluralise a count noun (singular at one or below; abbreviations never change). */
function pluralize(unit: string, count: number): string {
  const u = unit.trim();
  if (count <= 1) return u;
  const key = u.toLowerCase();
  if (NON_PLURAL_UNITS.has(key)) return u;
  if (
    key.endsWith("s") || key.endsWith("x") || key.endsWith("z") ||
    key.endsWith("ch") || key.endsWith("sh")
  ) return `${u}es`;
  if (key.endsWith("y") && key.length >= 2 && !"aeiou".includes(key[key.length - 2])) {
    return `${u.slice(0, -1)}ies`;
  }
  return `${u}s`;
}

/** "½ tin", "1 tin", "1½ tins", "2 eggs" — a value+unit rendered the kitchen way. A bare value
 * (no unit) just renders the fraction ("½"). */
export function formatQuantityLabel(value: number, unit: string | null | undefined): string {
  const snapped = snapQuarter(value);
  const n = fractionString(snapped);
  const u = (unit ?? "").trim();
  if (!u || GENERIC_COUNT_WORDS.has(u.toLowerCase())) return n;
  return `${n} ${pluralize(u, snapped)}`;
}

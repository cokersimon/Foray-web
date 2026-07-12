const n = (x: unknown): number | null =>
  typeof x === "number" && Number.isFinite(x) ? x : null;

/**
 * Calories on an ingredient line: prefer ADR-040 `lineMacros.kcal`, then flat
 * legacy `kcal` / `calories`.
 */
function pickKcalFromIngredientObject(ingredient: unknown): number | null {
  if (ingredient == null || typeof ingredient !== "object") return null;
  const o = ingredient as Record<string, unknown>;
  const lineMacros = o.lineMacros;
  if (lineMacros != null && typeof lineMacros === "object") {
    const fromLine = n((lineMacros as Record<string, unknown>).kcal);
    if (fromLine != null) return fromLine;
  }
  return n(o.kcal) ?? n(o.calories) ?? null;
}

/**
 * Legacy: per-line object from `resolvedIngredients[]` (nested nutrition, etc.).
 */
export function pickResolvedIngredientKcal(resolved: unknown): number | null {
  if (resolved == null || typeof resolved !== "object") return null;
  const o = resolved as Record<string, unknown>;

  const direct =
    n(o.calories) ??
    n(o.kcal) ??
    n(o.energyKcal) ??
    n(o.computedCalories) ??
    n(o.caloriesForQuantity) ??
    n(o.caloriesForServing);
  if (direct != null) return direct;

  const nut = o.nutrition;
  if (nut != null && typeof nut === "object") {
    const nuto = nut as Record<string, unknown>;
    return (
      n(nuto.calories) ??
      n(nuto.energy) ??
      n(nuto.kcal) ??
      n(nuto.energyKcal) ??
      null
    );
  }

  return null;
}

/**
 * Per-ingredient kcal for the recipe quantity: read from the ingredient first
 * (`kcal` / `calories`), then optionally a legacy `resolvedIngredients` row.
 */
export function pickIngredientLineKcal(
  ingredient: unknown,
  resolvedFallback?: unknown,
): number | null {
  const fromIng = pickKcalFromIngredientObject(ingredient);
  if (fromIng != null) return fromIng;
  return pickResolvedIngredientKcal(resolvedFallback);
}

export function formatIngredientKcal(kcal: number): string {
  const rounded = Math.round(kcal * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

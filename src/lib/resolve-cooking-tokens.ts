/**
 * Cooking-step token resolver for the Admin Review UI.
 *
 * The database stays in the "token system" format where AI-ingested cooking
 * instructions embed per-ingredient references like `{qty_0}`, `{qty_12}`, etc.
 * Those indexes are zero-based and point at `recipeData.ingredients[n]`.
 *
 * Admin reviewers want to verify numbers visually without reading code, so
 * this module returns a list of text/resolved/unresolved segments that the
 * UI can render with distinct styling. The on-disk document is never mutated.
 */

export type CookingSegment =
  | { kind: "text"; text: string }
  | {
      kind: "resolved";
      text: string;
      token: string;
      ingredientIndex: number;
      quantity: number | string;
      unit: string;
    }
  | {
      kind: "unresolved";
      text: string;
      token: string;
      reason: "no_ingredients" | "index_out_of_range" | "missing_quantity";
    };

/** Minimal shape we rely on. Extra fields are ignored so this stays decoupled. */
export interface ResolveIngredient {
  quantity?: number | string | null;
  unit?: string | null;
}

/**
 * Matches `{qty_0}` style tokens (also tolerates inner whitespace, e.g. `{ qty_0 }`).
 * The capture group holds the zero-based ingredient index as a string.
 */
const TOKEN_RE = /\{\s*qty_(\d+)\s*\}/gi;

function toQuantityString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") {
    const t = value.trim();
    return t.length > 0 ? t : null;
  }
  return null;
}

function toUnitString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

/**
 * Formats a resolved ingredient as `[150g]` (no space between number and unit,
 * per the Admin UI spec). If no unit is present, returns `[150]`.
 */
export function formatResolvedQuantity(
  quantity: number | string,
  unit: string,
): string {
  const qs = typeof quantity === "number" ? String(quantity) : quantity.trim();
  const us = unit.trim();
  return us ? `[${qs}${us}]` : `[${qs}]`;
}

/**
 * Splits a cooking instruction into segments: plain text, resolved `[qty unit]`
 * chips, and unresolved tokens (with a reason the UI can surface).
 */
export function resolveCookingInstruction(
  instruction: string,
  ingredients: ReadonlyArray<ResolveIngredient> | null | undefined,
): CookingSegment[] {
  if (typeof instruction !== "string" || instruction.length === 0) {
    return [];
  }
  const list = Array.isArray(ingredients) ? ingredients : [];
  const segments: CookingSegment[] = [];
  let cursor = 0;
  TOKEN_RE.lastIndex = 0;

  for (let match = TOKEN_RE.exec(instruction); match !== null; match = TOKEN_RE.exec(instruction)) {
    const [tokenText, idxStr] = match;
    const start = match.index;

    if (start > cursor) {
      segments.push({ kind: "text", text: instruction.slice(cursor, start) });
    }

    const index = Number.parseInt(idxStr, 10);
    const reason: "no_ingredients" | "index_out_of_range" | "missing_quantity" | null = (() => {
      if (list.length === 0) return "no_ingredients";
      if (!Number.isInteger(index) || index < 0 || index >= list.length) {
        return "index_out_of_range";
      }
      return null;
    })();

    if (reason) {
      segments.push({ kind: "unresolved", text: tokenText, token: tokenText, reason });
    } else {
      const ing = list[index] ?? {};
      const qty = toQuantityString(ing.quantity);
      if (qty == null) {
        segments.push({
          kind: "unresolved",
          text: tokenText,
          token: tokenText,
          reason: "missing_quantity",
        });
      } else {
        const unit = toUnitString(ing.unit);
        segments.push({
          kind: "resolved",
          text: formatResolvedQuantity(qty, unit),
          token: tokenText,
          ingredientIndex: index,
          quantity: qty,
          unit,
        });
      }
    }

    cursor = start + tokenText.length;
  }

  if (cursor < instruction.length) {
    segments.push({ kind: "text", text: instruction.slice(cursor) });
  }

  return segments;
}

/**
 * Convenience helper when you just want the plain resolved string (no chips).
 * Unresolved tokens are passed through verbatim so the admin can still see
 * that something went wrong.
 */
export function resolveCookingInstructionToString(
  instruction: string,
  ingredients: ReadonlyArray<ResolveIngredient> | null | undefined,
): string {
  const segs = resolveCookingInstruction(instruction, ingredients);
  let out = "";
  for (const s of segs) out += s.text;
  return out;
}

/**
 * Friendly explanation of an unresolved token reason for tooltips.
 */
export function describeUnresolvedReason(
  reason: "no_ingredients" | "index_out_of_range" | "missing_quantity",
): string {
  switch (reason) {
    case "no_ingredients":
      return "Step has a {qty_n} token but the recipe has no ingredients array.";
    case "index_out_of_range":
      return "Token points to an ingredient index that doesn't exist.";
    case "missing_quantity":
      return "Referenced ingredient has no quantity to resolve.";
    default:
      return "Unresolved token.";
  }
}

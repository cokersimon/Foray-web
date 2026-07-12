"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  X,
  Loader2,
  Wand2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatIngredientKcal,
  pickIngredientLineKcal,
} from "@/lib/resolved-ingredient-kcal";
import { resolveStagingRecipeTags } from "@/lib/staging-recipe-tags";
import { splitCuisineTags } from "@/lib/cuisine-taxonomy";
import {
  ALLERGEN_VOCAB,
  DIETARY_VOCAB,
  MEAL_TYPE_VOCAB,
  allergenLabel,
} from "@/lib/recipe-vocab";
import { formatQuantityLabel, fractionString } from "@/lib/format-quantity";
import { PlanBrowseShelvesPanel } from "@/components/admin/plan-browse-shelves-panel";

type ImageGenStatus = "idle" | "pending" | "error" | undefined;

type IngredientEditPatch = {
  name?: string;
  quantity?: number;
  unit?: string;
};

type CookingTokenType =
  | "text"
  | "ingredient"
  | "quantity"
  | "time"
  | "temperature";

type CookingGuideToken = {
  type: CookingTokenType;
  value: string | number;
  unit?: string;
  ingredientRef?: string;
  ingredientIndex?: number;
  scale?: "linear" | "static";
  timerEnabled?: boolean;
};

type CookingGuideStepDisplay = {
  stepNumber: number;
  instruction: string;
  tokens: CookingGuideToken[];
};

const INGREDIENT_UNIT_OPTIONS = [
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "oz",
  "lb",
] as const;

const INGREDIENT_COUNT_UNIT_SUGGESTIONS = [
  "piece",
  "pack",
  "drumstick",
  "rasher",
  "clove",
  "bunch",
  "handful",
  "can",
  "jar",
  "slice",
  "egg",
  "fillet",
  "stick",
  "head",
  "sprig",
] as const;

const INGREDIENT_UNIT_DATALIST = [
  ...INGREDIENT_UNIT_OPTIONS,
  ...INGREDIENT_COUNT_UNIT_SUGGESTIONS,
] as const;

const INGREDIENT_UNIT_DATALIST_ID = "ingredient-unit-suggestions";

function normalizeIngredientUnitForEditor(unit: unknown): string {
  if (typeof unit !== "string" || !unit.trim()) return "piece";
  const normalized = unit.trim().toLowerCase();
  const aliases: Record<string, string> = {
    gram: "g",
    grams: "g",
    kilogram: "kg",
    kilograms: "kg",
    millilitre: "ml",
    millilitres: "ml",
    milliliter: "ml",
    milliliters: "ml",
    litre: "l",
    litres: "l",
    liter: "l",
    liters: "l",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    cups: "cup",
    ounce: "oz",
    ounces: "oz",
    lbs: "lb",
    pound: "lb",
    pounds: "lb",
    pieces: "piece",
    packs: "pack",
    drumsticks: "drumstick",
    rashers: "rasher",
    cloves: "clove",
    cans: "can",
    jars: "jar",
    slices: "slice",
    eggs: "egg",
    fillets: "fillet",
    sticks: "stick",
    sprigs: "sprig",
  };
  return aliases[normalized] ?? normalized;
}

function resolveIngredientQuantityFields(row: Record<string, unknown>): {
  qtyValue: number | null;
  unitValue: string;
} {
  const nested = row.quantity;
  if (nested != null && typeof nested === "object" && !Array.isArray(nested)) {
    const quantity = nested as Record<string, unknown>;
    const rawValue = quantity.value;
    const qtyValue =
      typeof rawValue === "number" && Number.isFinite(rawValue) ? rawValue : null;
    const unitRaw =
      typeof quantity.unit === "string"
        ? quantity.unit
        : typeof row.unit === "string"
          ? row.unit
          : "";
    return {
      qtyValue,
      unitValue: normalizeIngredientUnitForEditor(unitRaw),
    };
  }

  const qty = row.quantity;
  const qtyValue =
    typeof qty === "number" && Number.isFinite(qty) ? qty : null;
  return {
    qtyValue,
    unitValue: normalizeIngredientUnitForEditor(row.unit),
  };
}

function IngredientUnitField({
  value,
  disabled,
  onChange,
  ariaLabel,
  className,
}: {
  value: string;
  disabled: boolean;
  onChange: (unit: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <input
      list={INGREDIENT_UNIT_DATALIST_ID}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={
        className ??
        "rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-900 shadow-sm transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500"
      }
      aria-label={ariaLabel}
    />
  );
}

function normalizeCookingTokenType(value: unknown): CookingTokenType | null {
  if (
    value === "text" ||
    value === "ingredient" ||
    value === "quantity" ||
    value === "time" ||
    value === "temperature"
  ) {
    return value;
  }
  return null;
}

function normalizeCookingTokens(value: unknown): CookingGuideToken[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((token) => {
    if (token == null || typeof token !== "object") return [];
    const row = token as Record<string, unknown>;
    const type = normalizeCookingTokenType(row.type);
    const rawValue = row.value;
    if (!type || (typeof rawValue !== "string" && typeof rawValue !== "number")) {
      return [];
    }
    const normalized: CookingGuideToken = {
      type,
      value: rawValue,
    };
    if (typeof row.unit === "string" && row.unit.trim()) {
      normalized.unit = row.unit.trim();
    }
    if (typeof row.ingredientRef === "string" && row.ingredientRef.trim()) {
      normalized.ingredientRef = row.ingredientRef.trim();
    }
    if (
      typeof row.ingredientIndex === "number" &&
      Number.isInteger(row.ingredientIndex) &&
      row.ingredientIndex >= 0
    ) {
      normalized.ingredientIndex = row.ingredientIndex;
    }
    if (row.scale === "linear" || row.scale === "static") {
      normalized.scale = row.scale;
    }
    if (typeof row.timerEnabled === "boolean") {
      normalized.timerEnabled = row.timerEnabled;
    }
    return [normalized];
  });
}

function normalizeCookingGuideForDisplay(
  data: Record<string, unknown> | undefined,
): CookingGuideStepDisplay[] {
  const source = Array.isArray(data?.cookingGuide)
    ? data.cookingGuide
    : Array.isArray(data?.steps)
      ? data.steps
      : [];

  return source.flatMap((step, index) => {
    if (typeof step === "string") {
      const instruction = step.trim();
      return instruction
        ? [{ stepNumber: index + 1, instruction, tokens: [] }]
        : [];
    }
    if (step == null || typeof step !== "object") return [];
    const row = step as Record<string, unknown>;
    const instruction =
      typeof row.instruction === "string" ? row.instruction.trim() : "";
    if (!instruction) return [];
    const stepNumber =
      typeof row.stepNumber === "number" && Number.isFinite(row.stepNumber)
        ? row.stepNumber
        : index + 1;
    return [{ stepNumber, instruction, tokens: normalizeCookingTokens(row.tokens) }];
  });
}

function emptyCookingToken(): CookingGuideToken {
  return {
    type: "text",
    value: "",
  };
}

function cookingTokenClassName(type: CookingTokenType): string {
  switch (type) {
    case "ingredient":
      return "bg-green-100 text-green-800 font-medium px-1 rounded";
    case "quantity":
      return "bg-orange-100 text-orange-800 font-medium px-1 rounded";
    case "time":
      return "bg-blue-100 text-blue-800 font-medium px-1 rounded";
    case "temperature":
      return "bg-red-100 text-red-800 font-medium px-1 rounded";
    case "text":
    default:
      return "";
  }
}

/** Render a token chip from the token's OWN value so it matches the stored instruction (and the
 * phone) exactly: quantities as kitchen fractions ("½ tin"), times/temperatures naturally. This
 * does NOT re-derive from the live ingredient rows (which showed the raw "0.5"). */
function formatCookingTokenChip(token: CookingGuideToken): string {
  const numericValue =
    typeof token.value === "number" ? token.value : Number(token.value);
  switch (token.type) {
    case "quantity":
      return Number.isFinite(numericValue)
        ? formatQuantityLabel(numericValue, token.unit)
        : String(token.value);
    case "time": {
      if (!Number.isFinite(numericValue)) return String(token.value);
      const base = (token.unit ?? "minutes").trim();
      const singular = base.endsWith("s") ? base.slice(0, -1) : base;
      const n = Number.isInteger(numericValue)
        ? String(numericValue)
        : numericValue.toFixed(1);
      return `${n} ${numericValue === 1 ? singular : `${singular}s`}`;
    }
    case "temperature": {
      if (!Number.isFinite(numericValue)) return String(token.value);
      const symbol = (token.unit ?? "C").toUpperCase().includes("F") ? "F" : "C";
      const n = Number.isInteger(numericValue)
        ? String(numericValue)
        : numericValue.toFixed(1);
      return `${n}°${symbol}`;
    }
    case "ingredient":
    case "text":
    default:
      return String(token.value);
  }
}

function normalizeTokenForSave(token: CookingGuideToken): CookingGuideToken {
  const valueText = String(token.value).trim();
  const numericValue = Number(valueText);
  const value =
    token.type !== "text" &&
    token.type !== "ingredient" &&
    valueText !== "" &&
    Number.isFinite(numericValue)
      ? numericValue
      : valueText;
  return {
    type: token.type,
    value,
    ...(token.unit?.trim() ? { unit: token.unit.trim() } : {}),
    ...(token.ingredientRef?.trim()
      ? { ingredientRef: token.ingredientRef.trim() }
      : {}),
    ...(token.ingredientIndex != null && Number.isInteger(token.ingredientIndex)
      ? { ingredientIndex: token.ingredientIndex }
      : {}),
    ...(token.scale ? { scale: token.scale } : {}),
    ...(token.timerEnabled != null ? { timerEnabled: token.timerEnabled } : {}),
  };
}

interface StagingRecipeDetail {
  _id: string;
  name: string;
  description?: string;
  status: string;
  source: string;
  sourceUrl?: string | null;
  heroImageUrl?: string;
  heroImageApproved?: boolean;
  recipeData?: Record<string, unknown>;
  tagsCuisine?: string[];
  tagsMealType?: string[];
  tagsDietary?: string[];
  /** Array per the new schema; legacy docs may still be a single string. */
  tagsCookSpeed?: string[] | string;
  tagsSeasonality?: string[];
  computedAllergens?: string[];
  expectedCalories?: number;
  expectedProtein?: number;
  expectedCarbs?: number;
  expectedFat?: number;
  computedCalories?: number;
  computedProtein?: number;
  computedCarbs?: number;
  computedFat?: number;
  nutritionReady?: boolean;
  batchId?: string;
  reviewNotes?: string;
  createdAt: number;
  updatedAt?: number;
  imageGenStatus?: ImageGenStatus;
  lastImageGenError?: string;
  /** Admin trending cold-start hint (ADR-019) — toggled via the Featured switch. */
  featured?: boolean;
}

interface RecipeEditorProps {
  recipe: StagingRecipeDetail | null | undefined;
  onApprove: (id: string) => void;
  onReject: (id: string, notes?: string) => void;
  /** When set, approved recipes show a Publish action instead of approve/reject. */
  onPublish?: (id: string) => void | Promise<void>;
  /** When set, published recipes show an Unpublish action. */
  onUnpublish?: (id: string) => void | Promise<void>;
  /** Last publish mutation error (from parent), cleared when selection changes. */
  publishError?: string | null;
  /** Last unpublish mutation error (from parent), cleared when selection changes. */
  unpublishError?: string | null;
  /** Toggle the admin "featured" cold-start hint (ADR-019). */
  onToggleFeatured?: (id: string, featured: boolean) => void | Promise<void>;
  isTogglingFeatured?: boolean;
  /** Permanently remove this staging row (any status); confirm lives in parent handler. */
  onDeleteStagingRecipe?: (id: string) => void | Promise<void>;
  deletingStagingId?: string | null;
  /** Shown when delete mutation failed (detail view). */
  deleteError?: string | null;
  onRefreshNutrition: (id: string) => void | Promise<void>;
  onRequestHeroImageGeneration: (id: string) => Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  isRefreshingNutrition?: boolean;
  onUpdateApprovedIngredient?: (
    stagingId: string,
    ingredientIndex: number,
    patch: IngredientEditPatch,
  ) => void | Promise<void>;
  updatingApprovedIngredientIndex?: number | null;
  onDeleteIngredient?: (
    stagingId: string,
    ingredientIndex: number,
  ) => void | Promise<void>;
  deletingIngredientIndex?: number | null;
  onUpdateCookingGuide?: (
    stagingId: string,
    cookingGuide: CookingGuideStepDisplay[],
  ) => void | Promise<void>;
  onRegenerateCookingStepTokens?: (
    stagingId: string,
    stepIndex: number,
    instruction: string,
  ) => Promise<CookingGuideToken[]>;
  isSavingCookingGuide?: boolean;
  regeneratingCookingStepIndex?: number | null;
  /** Persist a manual tag edit (meal type → `tags`, dietary → `dietaryLabels`,
   * allergens → `allergenFlags`). When set, the Tags section becomes editable. */
  onUpdateTags?: (
    stagingId: string,
    patch: { tags?: string[]; dietaryLabels?: string[]; allergenFlags?: string[] },
  ) => void | Promise<void>;
  isSavingTags?: boolean;
}

/** The three editable tag categories and the staging field each persists to. */
type EditableTagGroup = "mealType" | "dietary" | "allergens";

function hasHeroImageUrl(recipe: StagingRecipeDetail): boolean {
  return Boolean(recipe.heroImageUrl?.trim());
}

/**
 * Renders each tag category with its own distinct badge color + a label
 * prefix so admins can verify at a glance which field a tag came from.
 *
 * Allergens use a rose/red swatch so they stand out as a safety signal.
 * `cookSpeed` is tolerant of a legacy `string` (pre-migration docs) and the
 * new `string[]` shape.
 */
function TagGroups({
  cuisine,
  mealType,
  dietary,
  cookSpeed,
  seasonality,
  allergens,
  editable = false,
  saving = false,
  onAddTag,
  onRemoveTag,
}: {
  cuisine?: string[];
  mealType?: string[];
  dietary?: string[];
  cookSpeed?: string[] | string;
  seasonality?: string[];
  allergens?: string[];
  /** When true, meal type / dietary / allergens become editable (× to remove, dropdown to add). */
  editable?: boolean;
  saving?: boolean;
  onAddTag?: (group: EditableTagGroup, value: string) => void;
  onRemoveTag?: (group: EditableTagGroup, value: string) => void;
}) {
  const toCleanList = (value: string[] | string | undefined): string[] => {
    if (value == null) return [];
    const arr = Array.isArray(value) ? value : [value];
    return arr
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  };

  const cuisineList = toCleanList(cuisine);
  const mealTypeList = toCleanList(mealType);
  const dietaryList = toCleanList(dietary);
  const cookSpeedList = toCleanList(cookSpeed);
  const seasonalityList = toCleanList(seasonality);
  const allergensList = toCleanList(allergens);

  const VOCAB: Record<EditableTagGroup, readonly string[]> = {
    mealType: MEAL_TYPE_VOCAB,
    dietary: DIETARY_VOCAB,
    allergens: ALLERGEN_VOCAB,
  };
  const displayLabel = (groupId: string, value: string): string =>
    groupId === "allergens" ? allergenLabel(value) : value;

  const hasAny =
    cuisineList.length > 0 ||
    mealTypeList.length > 0 ||
    dietaryList.length > 0 ||
    cookSpeedList.length > 0 ||
    seasonalityList.length > 0 ||
    allergensList.length > 0;

  if (!hasAny && !editable) {
    return <span className="text-xs font-medium text-neutral-700">No tags</span>;
  }

  const groups: Array<{
    id: string;
    label: string;
    values: string[];
    swatch: string;
    pill: string;
    prefix: string;
    editable: boolean;
  }> = [
    {
      id: "cuisine",
      label: "Cuisine",
      values: cuisineList,
      swatch: "bg-sky-500",
      pill: "border-sky-300 bg-sky-50 text-sky-900",
      prefix: "text-sky-700",
      editable: false,
    },
    {
      id: "mealType",
      label: "Meal Type",
      values: mealTypeList,
      swatch: "bg-violet-500",
      pill: "border-violet-300 bg-violet-50 text-violet-900",
      prefix: "text-violet-700",
      editable,
    },
    {
      id: "dietary",
      label: "Dietary",
      values: dietaryList,
      swatch: "bg-emerald-500",
      pill: "border-emerald-300 bg-emerald-50 text-emerald-900",
      prefix: "text-emerald-700",
      editable,
    },
    {
      id: "cookSpeed",
      label: "Cook Speed",
      values: cookSpeedList,
      swatch: "bg-amber-500",
      pill: "border-amber-300 bg-amber-50 text-amber-900",
      prefix: "text-amber-700",
      editable: false,
    },
    {
      id: "seasonality",
      label: "Seasonality",
      values: seasonalityList,
      swatch: "bg-teal-500",
      pill: "border-teal-300 bg-teal-50 text-teal-900",
      prefix: "text-teal-700",
      editable: false,
    },
    {
      id: "allergens",
      label: "Allergens",
      values: allergensList,
      swatch: "bg-rose-500",
      pill: "border-rose-300 bg-rose-50 text-rose-900",
      prefix: "text-rose-700",
      editable,
    },
  ];

  return (
    <div className="space-y-2">
      {groups.map((g) => {
        // Non-editable empty groups stay hidden; editable ones always render so the add control shows.
        if (g.values.length === 0 && !g.editable) return null;

        const present = new Set(g.values.map((v) => v.toLowerCase()));
        const options = g.editable
          ? VOCAB[g.id as EditableTagGroup].filter((v) => !present.has(v.toLowerCase()))
          : [];

        return (
          <div key={g.id} className="flex flex-wrap items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-700"
              aria-label={`${g.label} tags`}
            >
              <span className={cn("h-2 w-2 rounded-full", g.swatch)} aria-hidden />
              {g.label}
            </span>
            {g.values.map((tag, idx) => (
              <span
                key={`${g.id}-${idx}-${tag}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  g.pill,
                )}
              >
                <span
                  className={cn(
                    "text-[9px] font-semibold uppercase tracking-wider",
                    g.prefix,
                  )}
                >
                  {g.label}
                </span>
                <span>{displayLabel(g.id, tag)}</span>
                {g.editable ? (
                  <button
                    type="button"
                    onClick={() => onRemoveTag?.(g.id as EditableTagGroup, tag)}
                    disabled={saving}
                    aria-label={`Remove ${displayLabel(g.id, tag)}`}
                    className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-current opacity-60 transition hover:bg-black/10 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <X className="h-2.5 w-2.5" aria-hidden />
                  </button>
                ) : null}
              </span>
            ))}
            {g.editable ? (
              <select
                value=""
                disabled={saving || options.length === 0}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value) onAddTag?.(g.id as EditableTagGroup, value);
                  event.currentTarget.selectedIndex = 0;
                }}
                aria-label={`Add ${g.label.toLowerCase()}`}
                className="rounded-full border border-dashed border-neutral-300 bg-white px-2 py-0.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {options.length === 0 ? "All added" : "+ Add"}
                </option>
                {options.map((opt) => (
                  <option key={`${g.id}-opt-${opt}`} value={opt}>
                    {displayLabel(g.id, opt)}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function RecipeEditor({
  recipe,
  onApprove,
  onReject,
  onPublish,
  onUnpublish,
  publishError = null,
  unpublishError = null,
  onToggleFeatured,
  isTogglingFeatured = false,
  onDeleteStagingRecipe,
  deletingStagingId = null,
  deleteError = null,
  onRefreshNutrition,
  onRequestHeroImageGeneration,
  isApproving,
  isRejecting,
  isPublishing = false,
  isUnpublishing = false,
  isRefreshingNutrition = false,
  onUpdateApprovedIngredient,
  updatingApprovedIngredientIndex = null,
  onDeleteIngredient,
  deletingIngredientIndex = null,
  onUpdateCookingGuide,
  onRegenerateCookingStepTokens,
  isSavingCookingGuide = false,
  regeneratingCookingStepIndex = null,
  onUpdateTags,
  isSavingTags = false,
}: RecipeEditorProps) {
  const [generateMutationError, setGenerateMutationError] = useState<
    string | null
  >(null);
  const [isRequestingGen, setIsRequestingGen] = useState(false);
  const [approvedIngredientDrafts, setApprovedIngredientDrafts] = useState<
    Record<number, IngredientEditPatch>
  >({});
  const [approvedIngredientEditError, setApprovedIngredientEditError] =
    useState<string | null>(null);
  const [pendingIngredientDelete, setPendingIngredientDelete] = useState<{
    index: number;
    label: string;
  } | null>(null);
  const [isEditingCookingGuide, setIsEditingCookingGuide] = useState(false);
  const [cookingGuideDrafts, setCookingGuideDrafts] = useState<
    CookingGuideStepDisplay[]
  >([]);
  const [cookingGuideEditError, setCookingGuideEditError] = useState<
    string | null
  >(null);
  const recipeId = recipe?._id;
  const recipeImageGenStatus = recipe?.imageGenStatus;

  useEffect(() => {
    setGenerateMutationError(null);
    setApprovedIngredientDrafts({});
    setApprovedIngredientEditError(null);
    setPendingIngredientDelete(null);
    setIsEditingCookingGuide(false);
    setCookingGuideDrafts([]);
    setCookingGuideEditError(null);
  }, [recipeId]);

  useEffect(() => {
    if (recipeImageGenStatus === "pending") {
      setGenerateMutationError(null);
    }
  }, [recipeImageGenStatus, recipeId]);

  const handleGenerateClick = useCallback(async () => {
    if (!recipe) return;
    setGenerateMutationError(null);
    setIsRequestingGen(true);
    try {
      await onRequestHeroImageGeneration(recipe._id);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to start image generation";
      setGenerateMutationError(msg);
    } finally {
      setIsRequestingGen(false);
    }
  }, [recipe, onRequestHeroImageGeneration]);

  if (recipe === undefined) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-700">
        Loading...
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-neutral-700">
        Select a recipe to review
      </div>
    );
  }

  const data = recipe.recipeData as Record<string, unknown> | undefined;
  const sourceUrl =
    (typeof recipe.sourceUrl === "string" && recipe.sourceUrl.trim()) ||
    (typeof data?.sourceUrl === "string" && data.sourceUrl.trim()) ||
    "";
  const ingredientCount = Array.isArray(data?.ingredients)
    ? (data.ingredients as unknown[]).length
    : 0;
  const cookingGuideCount = Array.isArray(data?.cookingGuide)
    ? (data.cookingGuide as unknown[]).length
    : Array.isArray(data?.steps)
      ? (data.steps as unknown[]).length
      : 0;
  const cookingGuideSteps = normalizeCookingGuideForDisplay(data);
  const editableCookingGuideSteps = isEditingCookingGuide
    ? cookingGuideDrafts
    : cookingGuideSteps;

  const startCookingGuideEdit = () => {
    setCookingGuideEditError(null);
    setCookingGuideDrafts(
      cookingGuideSteps.map((step) => ({
        ...step,
        tokens: step.tokens.map((token) => ({ ...token })),
      })),
    );
    setIsEditingCookingGuide(true);
  };

  const updateCookingGuideDraftInstruction = (
    stepIndex: number,
    instruction: string,
  ) => {
    setCookingGuideDrafts((steps) =>
      steps.map((step, index) =>
        index === stepIndex ? { ...step, instruction } : step,
      ),
    );
  };

  const updateCookingGuideDraftToken = (
    stepIndex: number,
    tokenIndex: number,
    patch: Partial<CookingGuideToken>,
  ) => {
    setCookingGuideDrafts((steps) =>
      steps.map((step, index) => {
        if (index !== stepIndex) return step;
        return {
          ...step,
          tokens: step.tokens.map((token, tIndex) =>
            tIndex === tokenIndex ? { ...token, ...patch } : token,
          ),
        };
      }),
    );
  };

  const addCookingGuideDraftToken = (stepIndex: number) => {
    setCookingGuideDrafts((steps) =>
      steps.map((step, index) =>
        index === stepIndex
          ? { ...step, tokens: [...step.tokens, emptyCookingToken()] }
          : step,
      ),
    );
  };

  const removeCookingGuideDraftToken = (
    stepIndex: number,
    tokenIndex: number,
  ) => {
    setCookingGuideDrafts((steps) =>
      steps.map((step, index) =>
        index === stepIndex
          ? {
              ...step,
              tokens: step.tokens.filter((_, tIndex) => tIndex !== tokenIndex),
            }
          : step,
      ),
    );
  };

  const saveCookingGuideDrafts = async () => {
    if (!recipe || !onUpdateCookingGuide) return;
    const cookingGuide = cookingGuideDrafts.map((step, index) => ({
      stepNumber: step.stepNumber || index + 1,
      instruction: step.instruction.trim(),
      tokens: step.tokens
        .map(normalizeTokenForSave)
        .filter((token) => String(token.value).trim().length > 0),
    }));
    if (cookingGuide.some((step) => !step.instruction)) {
      setCookingGuideEditError("Every cooking step needs instruction text.");
      return;
    }
    setCookingGuideEditError(null);
    try {
      await onUpdateCookingGuide(recipe._id, cookingGuide);
      setIsEditingCookingGuide(false);
    } catch (error) {
      setCookingGuideEditError(
        error instanceof Error
          ? error.message
          : "Failed to save cooking guide changes.",
      );
    }
  };

  const regenerateStepTokens = async (
    stepIndex: number,
    instruction: string,
  ) => {
    if (!recipe || !onRegenerateCookingStepTokens) return;
    const cleanInstruction = instruction.trim();
    if (!cleanInstruction) {
      setCookingGuideEditError("Instruction cannot be empty.");
      return;
    }
    setCookingGuideEditError(null);
    try {
      const tokens = await onRegenerateCookingStepTokens(
        recipe._id,
        stepIndex,
        cleanInstruction,
      );
      setCookingGuideDrafts((steps) =>
        steps.map((step, index) =>
          index === stepIndex ? { ...step, tokens } : step,
        ),
      );
    } catch (error) {
      setCookingGuideEditError(
        error instanceof Error
          ? error.message
          : "Failed to regenerate cooking step tokens.",
      );
    }
  };

  const macroRows = [
    { macro: "Calories", actual: recipe.computedCalories },
    { macro: "Protein (g)", actual: recipe.computedProtein },
    { macro: "Carbs (g)", actual: recipe.computedCarbs },
    { macro: "Fat (g)", actual: recipe.computedFat },
  ] as const;

  const hasHero = hasHeroImageUrl(recipe);
  /** Root + nested `recipeData` + common key aliases (see staging-recipe-tags). */
  const resolvedTags = resolveStagingRecipeTags(recipe);

  // Manual tag editing (× to remove / dropdown to add). Meal type rides the unified `tags` array
  // (cuisine lives there too and is preserved on every patch); dietary → `dietaryLabels`, allergens
  // → `allergenFlags`. The dropdowns are constrained to the closed vocab so we never persist a tag
  // the app cannot filter.
  const rawTagsFull: string[] = (() => {
    const nested = recipe.recipeData as Record<string, unknown> | undefined;
    const t = nested?.tags;
    if (Array.isArray(t)) {
      return t
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }
    return resolvedTags.tagsMealType;
  })();
  const { cuisine: cuisineInTags, other: mealTypeEditable } =
    splitCuisineTags(rawTagsFull);

  const tagsEditable = Boolean(onUpdateTags);

  const currentTagValues = (group: EditableTagGroup): string[] => {
    if (group === "mealType") return mealTypeEditable;
    if (group === "dietary") return resolvedTags.tagsDietary;
    return resolvedTags.computedAllergens;
  };

  const tagPatchFor = (
    group: EditableTagGroup,
    nextValues: string[],
  ): { tags?: string[]; dietaryLabels?: string[]; allergenFlags?: string[] } => {
    if (group === "mealType") return { tags: [...cuisineInTags, ...nextValues] };
    if (group === "dietary") return { dietaryLabels: nextValues };
    return { allergenFlags: nextValues };
  };

  const handleAddTag = (group: EditableTagGroup, value: string) => {
    if (!onUpdateTags) return;
    const current = currentTagValues(group);
    if (current.some((v) => v.toLowerCase() === value.toLowerCase())) return;
    void onUpdateTags(recipe._id, tagPatchFor(group, [...current, value]));
  };

  const handleRemoveTag = (group: EditableTagGroup, value: string) => {
    if (!onUpdateTags) return;
    const current = currentTagValues(group);
    void onUpdateTags(
      recipe._id,
      tagPatchFor(
        group,
        current.filter((v) => v.toLowerCase() !== value.toLowerCase()),
      ),
    );
  };

  const imageGenPending = recipe.imageGenStatus === "pending";
  const serverGenError =
    recipe.imageGenStatus === "error" && recipe.lastImageGenError
      ? recipe.lastImageGenError
      : null;
  const inlineGenError = generateMutationError ?? serverGenError;

  const recipeBlockedByImage = !hasHero;

  const normalizedStatus = String(recipe.status ?? "")
    .trim()
    .toLowerCase();
  const canEditIngredientRows = Boolean(onUpdateApprovedIngredient);

  const rawIngredients = Array.isArray(data?.ingredients)
    ? (data.ingredients as unknown[])
    : [];
  const ingredientRows = rawIngredients.map((ing) => {
    const row = ing && typeof ing === "object" ? (ing as Record<string, unknown>) : {};
    const label =
      [row.displayString, row.description, row.name].find(
        (x) => typeof x === "string" && x.trim().length > 0,
      ) ?? "—";
    const { qtyValue, unitValue } = resolveIngredientQuantityFields(row);
    const qtyStr =
      qtyValue != null
        ? fractionString(qtyValue)
        : typeof row.quantity === "string" && row.quantity.trim()
          ? row.quantity.trim()
          : "—";
    const unitStr = unitValue || "—";
    // Render the kitchen way ("½ tin", "1 tin", "1½ tins") so the table matches the step text and
    // the phone — never a raw "0.5". Falls back to bare value when the unit is unknown.
    const quantityDisplay =
      qtyValue != null
        ? formatQuantityLabel(qtyValue, unitValue || undefined)
        : unitStr === "—"
          ? qtyStr
          : `${qtyStr} ${unitStr}`;
    const kcal = pickIngredientLineKcal(ing);
    const aisle = typeof row.aisle === "string" ? row.aisle.trim() : "";
    return {
      label: String(label),
      qtyValue,
      qtyStr,
      unitValue,
      unitStr,
      quantityDisplay,
      kcal,
      aisle,
    };
  });

  const updateApprovedIngredientDraft = (
    index: number,
    patch: IngredientEditPatch,
  ) => {
    setApprovedIngredientDrafts((current) => ({
      ...current,
      [index]: {
        ...current[index],
        ...patch,
      },
    }));
  };

  const approvedIngredientPatchForRow = (
    index: number,
    row: (typeof ingredientRows)[number],
  ): IngredientEditPatch => {
    const draft = approvedIngredientDrafts[index];
    if (!draft) return {};
    const name = draft.name?.trim();
    const patch: IngredientEditPatch = {};
    if (name && name !== row.label) patch.name = name;
    if (
      draft.quantity != null &&
      Number.isFinite(draft.quantity) &&
      draft.quantity > 0 &&
      draft.quantity !== row.qtyValue
    ) {
      patch.quantity = draft.quantity;
    }
    if (draft.unit && draft.unit !== row.unitValue) {
      patch.unit = draft.unit;
    }
    return patch;
  };

  const approvedIngredientDirtyEntries = ingredientRows
    .map((row, index) => ({
      index,
      patch: approvedIngredientPatchForRow(index, row),
    }))
    .filter(
      (entry) =>
        entry.patch.name ||
        entry.patch.quantity != null ||
        entry.patch.unit,
    );
  const hasApprovedIngredientDrafts =
    Object.keys(approvedIngredientDrafts).length > 0;
  const isSavingApprovedIngredients = updatingApprovedIngredientIndex != null;

  const saveApprovedIngredientDrafts = async () => {
    if (!onUpdateApprovedIngredient || approvedIngredientDirtyEntries.length === 0) {
      setApprovedIngredientDrafts({});
      return;
    }
    setApprovedIngredientEditError(null);
    try {
      for (const entry of approvedIngredientDirtyEntries) {
        await onUpdateApprovedIngredient(recipe._id, entry.index, entry.patch);
      }
      setApprovedIngredientDrafts({});
    } catch (error) {
      setApprovedIngredientEditError(
        error instanceof Error
          ? error.message
          : "Could not save ingredient changes",
      );
    }
  };

  const confirmDeleteIngredient = async (index: number) => {
    if (!onDeleteIngredient || !recipe) return;
    setApprovedIngredientEditError(null);
    try {
      await onDeleteIngredient(recipe._id, index);
      setApprovedIngredientDrafts((current) => {
        const next: Record<number, IngredientEditPatch> = {};
        for (const [key, value] of Object.entries(current)) {
          const numericKey = Number(key);
          if (!Number.isInteger(numericKey) || numericKey === index) continue;
          next[numericKey > index ? numericKey - 1 : numericKey] = value;
        }
        return next;
      });
      setPendingIngredientDelete(null);
    } catch (error) {
      setApprovedIngredientEditError(
        error instanceof Error ? error.message : "Could not delete ingredient",
      );
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-neutral-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">
              {recipe.name}
            </h2>
            {recipe.description && (
              <p className="mt-1 text-sm leading-relaxed text-neutral-800">
                {recipe.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onDeleteStagingRecipe ? (
              <button
                type="button"
                onClick={() =>
                  void onDeleteStagingRecipe(String(recipe._id))
                }
                disabled={
                  deletingStagingId != null &&
                  String(deletingStagingId) === String(recipe._id)
                }
                title="Delete staging recipe (all tabs)"
                aria-label="Delete staging recipe"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingStagingId != null &&
                String(deletingStagingId) === String(recipe._id) ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                )}
              </button>
            ) : null}
            <StatusBadge status={recipe.status} />
          </div>
        </div>
        {deleteError ? (
          <div
            className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-800"
            role="alert"
          >
            {deleteError}
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="flex-1 space-y-6 p-6">
        <details className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-neutral-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-100 [&::-webkit-details-marker]:hidden">
            <span>Recipe Metadata</span>
            <span className="text-[11px] normal-case tracking-normal text-neutral-500">
              {ingredientCount} ingredients · {cookingGuideCount} steps
            </span>
          </summary>
          <div className="grid grid-cols-2 gap-3 border-t border-neutral-200 p-4">
            <MetaField label="Source" value={recipe.source} />
            <MetaField label="Batch" value={recipe.batchId ?? "—"} />
            <MetaField label="Ingredients" value={String(ingredientCount)} />
            <MetaField label="Cooking Guide" value={String(cookingGuideCount)} />
            <MetaField
              label="Created"
              value={new Date(recipe.createdAt).toLocaleDateString()}
            />
            <MetaField
              label="Nutrition Ready"
              value={recipe.nutritionReady ? "Yes" : "No"}
            />
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-50"
              >
                View Original Source
              </a>
            ) : null}
          </div>
        </details>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Nutrition
          </h3>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm sm:grid-cols-4">
            {macroRows.map((row) => (
              <div
                key={row.macro}
                className="rounded-lg bg-neutral-50 px-3 py-2"
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
                  {row.macro}
                </div>
                <div className="mt-1 text-lg font-bold tabular-nums text-neutral-950">
                  {row.actual != null ? Math.round(row.actual) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {ingredientRows.length > 0 && (
          <div>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                Ingredients
              </h3>
            </div>
            <p className="mb-2 text-xs text-neutral-600">
              Columns: ingredient · quantity · kcal · aisle. Per-line kcal from{" "}
              <span className="font-mono text-[11px]">lineMacros</span>.
            </p>
            {approvedIngredientEditError ? (
              <div
                className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
                role="alert"
              >
                {approvedIngredientEditError}
              </div>
            ) : null}
            <div className="max-w-full overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
              <datalist id={INGREDIENT_UNIT_DATALIST_ID}>
                {INGREDIENT_UNIT_DATALIST.map((unit) => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
              <table className="w-full min-w-[36rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-800">
                    <th className="min-w-[10rem] px-4 py-3 font-semibold">
                      Ingredient
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                      Quantity
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                      Kcal
                    </th>
                    <th className="min-w-[8rem] px-3 py-3 font-semibold">
                      Aisle
                    </th>
                    {onDeleteIngredient && (
                      <th className="w-28 whitespace-nowrap px-3 py-3 text-center font-semibold">
                        Delete
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {ingredientRows.map((row, i) => {
                    const draft = approvedIngredientDrafts[i] ?? {};
                    const isSavingApprovedIngredient =
                      updatingApprovedIngredientIndex === i;
                    const editableName = draft.name ?? row.label;
                    const editableQuantity =
                      draft.quantity ?? row.qtyValue ?? "";
                    const editableUnit = draft.unit ?? row.unitValue;
                    const isDeletingIngredient = deletingIngredientIndex === i;
                    const isConfirmingDelete =
                      pendingIngredientDelete?.index === i;
                    return (
                    <tr
                      key={`ing-${i}`}
                      className="border-b border-neutral-100 last:border-b-0"
                    >
                      <td className="max-w-[16rem] px-4 py-2.5 font-medium text-neutral-900">
                        {canEditIngredientRows ? (
                          <input
                            type="text"
                            value={editableName}
                            disabled={
                              !onUpdateApprovedIngredient ||
                              isSavingApprovedIngredients
                            }
                            onChange={(event) =>
                              updateApprovedIngredientDraft(i, {
                                name: event.target.value,
                              })
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                              }
                              if (event.key === "Escape") {
                                setApprovedIngredientDrafts((current) => {
                                  const next = { ...current };
                                  delete next[i];
                                  return next;
                                });
                              }
                            }}
                            className="min-w-0 w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm font-medium text-neutral-900 shadow-sm transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500"
                            aria-label={`Edit ingredient ${i + 1} name`}
                          />
                        ) : (
                          <span
                            className="line-clamp-2"
                            title={row.label}
                          >
                            {row.label}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums text-neutral-900">
                        {canEditIngredientRows ? (
                          <div className="flex items-center justify-end gap-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={editableQuantity}
                              disabled={
                                !onUpdateApprovedIngredient ||
                                isSavingApprovedIngredients
                              }
                              onChange={(event) =>
                                updateApprovedIngredientDraft(i, {
                                  quantity:
                                    event.target.value === ""
                                      ? undefined
                                      : Number(event.target.value),
                                })
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                }
                                if (event.key === "Escape") {
                                  setApprovedIngredientDrafts((current) => {
                                    const next = { ...current };
                                    delete next[i];
                                    return next;
                                  });
                                }
                              }}
                              className="w-28 rounded-md border border-neutral-200 bg-white px-2 py-1 text-right text-sm tabular-nums text-neutral-900 shadow-sm transition-colors focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-500"
                              aria-label={`Edit ingredient ${i + 1} quantity`}
                            />
                            <IngredientUnitField
                              value={editableUnit}
                              disabled={
                                !onUpdateApprovedIngredient ||
                                isSavingApprovedIngredients
                              }
                              onChange={(unit) =>
                                updateApprovedIngredientDraft(i, { unit })
                              }
                              ariaLabel={`Edit ingredient ${i + 1} unit`}
                            />
                            {isSavingApprovedIngredient ? (
                              <Loader2
                                className="h-3.5 w-3.5 animate-spin text-neutral-500"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                        ) : (
                          row.quantityDisplay
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right tabular-nums font-medium text-neutral-900">
                        {row.kcal != null ? formatIngredientKcal(row.kcal) : "—"}
                      </td>
                      <td className="max-w-[12rem] px-3 py-2.5 text-xs leading-snug text-neutral-800">
                        <span className="line-clamp-2 break-words" title={row.aisle || undefined}>
                          {row.aisle || "—"}
                        </span>
                      </td>
                      {onDeleteIngredient && (
                        <td className="whitespace-nowrap px-3 py-2.5 text-center">
                          {isConfirmingDelete ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                disabled={isDeletingIngredient}
                                onClick={() => void confirmDeleteIngredient(i)}
                                className="inline-flex items-center justify-center rounded-md bg-red-700 px-2 py-1 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label={`Confirm delete ${row.label}`}
                              >
                                {isDeletingIngredient ? (
                                  <Loader2
                                    className="mr-1 h-3 w-3 animate-spin"
                                    aria-hidden
                                  />
                                ) : null}
                                Yes, delete
                              </button>
                              <button
                                type="button"
                                disabled={isDeletingIngredient}
                                onClick={() => setPendingIngredientDelete(null)}
                                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-2 py-1 text-[11px] font-semibold text-neutral-700 shadow-sm transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isSavingApprovedIngredients || isDeletingIngredient}
                              onClick={() =>
                                setPendingIngredientDelete({
                                  index: i,
                                  label: row.label,
                                })
                              }
                              className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              title={`Delete ${row.label}`}
                              aria-label={`Delete ${row.label}`}
                            >
                              <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {canEditIngredientRows ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-3">
                <p className="text-xs font-medium text-neutral-700">
                  {approvedIngredientDirtyEntries.length > 0
                    ? `${approvedIngredientDirtyEntries.length} ingredient change${
                        approvedIngredientDirtyEntries.length === 1 ? "" : "s"
                      } ready to save.`
                    : hasApprovedIngredientDrafts
                      ? "No saved changes yet."
                      : "Edit ingredient names, quantities, or units, then click Save."}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApprovedIngredientDrafts({});
                      setApprovedIngredientEditError(null);
                    }}
                    disabled={
                      !hasApprovedIngredientDrafts || isSavingApprovedIngredients
                    }
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveApprovedIngredientDrafts()}
                    disabled={
                      !onUpdateApprovedIngredient ||
                      approvedIngredientDirtyEntries.length === 0 ||
                      isSavingApprovedIngredients
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSavingApprovedIngredients ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : null}
                    Save ingredient changes
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Tags
          </h3>
          <TagGroups
            cuisine={resolvedTags.tagsCuisine}
            mealType={mealTypeEditable}
            dietary={resolvedTags.tagsDietary}
            cookSpeed={resolvedTags.tagsCookSpeed}
            seasonality={resolvedTags.tagsSeasonality}
            allergens={resolvedTags.computedAllergens}
            editable={tagsEditable}
            saving={isSavingTags}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
          />
          {tagsEditable ? (
            <p className="mt-1.5 text-[11px] text-neutral-500">
              Allergens are also auto-derived from the ingredients on every edit — a manual
              change can be re-added by the safety scan if an ingredient still matches.
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <PlanBrowseShelvesPanel recipe={recipe} variant="light" />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
              Cooking Guide
            </h3>
            {onUpdateCookingGuide ? (
              <div className="flex items-center gap-2">
                {isEditingCookingGuide ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingCookingGuide(false);
                        setCookingGuideDrafts([]);
                        setCookingGuideEditError(null);
                      }}
                      disabled={isSavingCookingGuide}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveCookingGuideDrafts()}
                      disabled={isSavingCookingGuide}
                      className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSavingCookingGuide ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : null}
                      Save Steps
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={startCookingGuideEdit}
                    className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-100"
                  >
                    Edit Steps
                  </button>
                )}
              </div>
            ) : null}
          </div>
          {cookingGuideEditError ? (
            <div
              className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
              role="alert"
            >
              {cookingGuideEditError}
            </div>
          ) : null}
          {editableCookingGuideSteps.length > 0 ? (
            <div className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              {editableCookingGuideSteps.map((step, stepIndex) => (
                <div
                  key={`${step.stepNumber}-${stepIndex}`}
                  className="rounded-lg bg-neutral-50 px-3 py-3"
                >
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold tabular-nums text-white">
                      {step.stepNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isEditingCookingGuide ? (
                        <textarea
                          value={step.instruction}
                          onChange={(event) =>
                            updateCookingGuideDraftInstruction(
                              stepIndex,
                              event.target.value,
                            )
                          }
                          rows={3}
                          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm leading-relaxed text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                          aria-label={`Edit cooking step ${step.stepNumber}`}
                        />
                      ) : step.tokens.length > 0 ? (
                        // Highlighted token chips, each formatted from its OWN value (ADR-051:
                        // tokens are the source of truth). Quantities render as kitchen fractions
                        // ("½ tin") so the chips match the stored instruction and the phone — never
                        // the raw "0.5" the old re-derive-from-ingredient-rows path produced.
                        <p className="pt-1 text-sm leading-7 text-neutral-900">
                          {step.tokens.map((token, tokenIndex) =>
                            token.type === "text" ? (
                              <span key={`${token.type}-${tokenIndex}`}>
                                {String(token.value)}
                              </span>
                            ) : (
                              <span
                                key={`${token.type}-${tokenIndex}`}
                                className={cn(
                                  "mx-0.5 inline-block leading-5",
                                  cookingTokenClassName(token.type),
                                )}
                                title={token.ingredientRef ?? token.type}
                              >
                                {formatCookingTokenChip(token)}
                              </span>
                            ),
                          )}
                        </p>
                      ) : (
                        // Tokenless step (e.g. legacy import): show the stored instruction string.
                        <p className="pt-1 text-sm leading-relaxed text-neutral-900">
                          {step.instruction}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditingCookingGuide ? (
                    <div className="mt-3 border-t border-neutral-200 pt-3">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                          Tokens
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          {onRegenerateCookingStepTokens ? (
                            <button
                              type="button"
                              onClick={() =>
                                void regenerateStepTokens(
                                  stepIndex,
                                  step.instruction,
                                )
                              }
                              disabled={
                                regeneratingCookingStepIndex === stepIndex ||
                                isSavingCookingGuide
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-semibold text-blue-800 shadow-sm transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {regeneratingCookingStepIndex === stepIndex ? (
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                              ) : (
                                <Wand2 className="h-3 w-3" aria-hidden />
                              )}
                              Regenerate Tags
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => addCookingGuideDraftToken(stepIndex)}
                            disabled={isSavingCookingGuide}
                            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Add Token
                          </button>
                        </div>
                      </div>
                      {step.tokens.length > 0 ? (
                        <div className="space-y-2">
                          {step.tokens.map((token, tokenIndex) => (
                            <div
                              key={`${stepIndex}-${tokenIndex}`}
                              className="grid gap-2 rounded-lg border border-neutral-200 bg-white p-2 sm:grid-cols-[7.5rem_minmax(0,1fr)_5rem_4.5rem_5rem_auto]"
                            >
                              <select
                                value={token.type}
                                onChange={(event) =>
                                  updateCookingGuideDraftToken(
                                    stepIndex,
                                    tokenIndex,
                                    {
                                      type: event.target.value as CookingTokenType,
                                    },
                                  )
                                }
                                disabled={isSavingCookingGuide}
                                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-900"
                                aria-label="Token type"
                              >
                                {[
                                  "text",
                                  "ingredient",
                                  "quantity",
                                  "time",
                                  "temperature",
                                ].map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                              <input
                                value={String(token.value)}
                                onChange={(event) =>
                                  updateCookingGuideDraftToken(
                                    stepIndex,
                                    tokenIndex,
                                    { value: event.target.value },
                                  )
                                }
                                disabled={isSavingCookingGuide}
                                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900"
                                placeholder="value"
                                aria-label="Token value"
                              />
                              <input
                                value={token.unit ?? ""}
                                onChange={(event) =>
                                  updateCookingGuideDraftToken(
                                    stepIndex,
                                    tokenIndex,
                                    { unit: event.target.value },
                                  )
                                }
                                disabled={isSavingCookingGuide}
                                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900"
                                placeholder="unit"
                                aria-label="Token unit"
                              />
                              <input
                                type="number"
                                value={token.ingredientIndex ?? ""}
                                onChange={(event) =>
                                  updateCookingGuideDraftToken(
                                    stepIndex,
                                    tokenIndex,
                                    {
                                      ingredientIndex:
                                        event.target.value === ""
                                          ? undefined
                                          : Number(event.target.value),
                                    },
                                  )
                                }
                                disabled={isSavingCookingGuide}
                                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900"
                                placeholder="idx"
                                aria-label="Ingredient index"
                              />
                              <select
                                value={token.scale ?? ""}
                                onChange={(event) =>
                                  updateCookingGuideDraftToken(
                                    stepIndex,
                                    tokenIndex,
                                    {
                                      scale:
                                        event.target.value === ""
                                          ? undefined
                                          : (event.target.value as "linear" | "static"),
                                    },
                                  )
                                }
                                disabled={isSavingCookingGuide}
                                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900"
                                aria-label="Token scale"
                              >
                                <option value="">scale</option>
                                <option value="linear">linear</option>
                                <option value="static">static</option>
                              </select>
                              <button
                                type="button"
                                onClick={() =>
                                  removeCookingGuideDraftToken(
                                    stepIndex,
                                    tokenIndex,
                                  )
                                }
                                disabled={isSavingCookingGuide}
                                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Remove
                              </button>
                              <input
                                value={token.ingredientRef ?? ""}
                                onChange={(event) =>
                                  updateCookingGuideDraftToken(
                                    stepIndex,
                                    tokenIndex,
                                    { ingredientRef: event.target.value },
                                  )
                                }
                                disabled={isSavingCookingGuide}
                                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-900 sm:col-span-2"
                                placeholder="ingredientRef, e.g. ingredient_0"
                                aria-label="Ingredient reference"
                              />
                              <label className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-medium text-neutral-800 sm:col-span-2">
                                <input
                                  type="checkbox"
                                  checked={token.timerEnabled === true}
                                  onChange={(event) =>
                                    updateCookingGuideDraftToken(
                                      stepIndex,
                                      tokenIndex,
                                      { timerEnabled: event.target.checked },
                                    )
                                  }
                                  disabled={isSavingCookingGuide}
                                  className="h-3.5 w-3.5 rounded border-neutral-300 text-blue-700 focus:ring-blue-200"
                                />
                                Timer enabled
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-3 py-2 text-xs text-neutral-600">
                          No tokens yet. Add one manually or regenerate tags.
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              No cooking guide steps found.
            </p>
          )}
        </div>

        {recipe.reviewNotes && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-800">
              Review Notes
            </h3>
            <p className="text-sm leading-relaxed text-neutral-900">
              {recipe.reviewNotes}
            </p>
          </div>
        )}
      </div>
      </div>

      {normalizedStatus === "ready_for_review" && (
        <div className="shrink-0 border-t border-neutral-200 bg-white p-4">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              {/* Approve: wrapper keeps pointer-events for tooltip when button is disabled */}
              <div
                className="pointer-events-auto min-w-0 flex-1"
                title={
                  recipeBlockedByImage
                    ? "Image required before approval"
                    : undefined
                }
              >
                <button
                  onClick={() => onApprove(recipe._id)}
                  disabled={recipeBlockedByImage || isApproving}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-900 disabled:opacity-50 [&_svg]:text-white",
                    recipeBlockedByImage && "pointer-events-none",
                  )}
                >
                  {isApproving ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />
                  ) : (
                    <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  )}
                  Approve
                </button>
              </div>

              <div
                className="pointer-events-auto min-w-0 flex-1"
                title={
                  recipeBlockedByImage
                    ? "Image required before rejection"
                    : undefined
                }
              >
                <button
                  onClick={() => onReject(recipe._id)}
                  disabled={recipeBlockedByImage || isRejecting}
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl bg-red-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-900 disabled:opacity-50 [&_svg]:text-white",
                    recipeBlockedByImage && "pointer-events-none",
                  )}
                >
                  {isRejecting ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />
                  ) : (
                    <X className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                  )}
                  Reject
                </button>
              </div>

              <div className="pointer-events-auto shrink-0">
                <button
                  onClick={() => void onRefreshNutrition(recipe._id)}
                  disabled={isRefreshingNutrition}
                  type="button"
                  title="Refresh Nutrition"
                  aria-busy={isRefreshingNutrition}
                  aria-label="Refresh Nutrition"
                  className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isRefreshingNutrition ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  )}
                </button>
              </div>
            </div>

            {!hasHero && (
              <div className="flex flex-col gap-2">
                {imageGenPending ? (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700"
                  >
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    Generating...
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerateClick}
                    disabled={isRequestingGen}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-900 disabled:opacity-50 [&_svg]:text-white"
                  >
                    {isRequestingGen ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />
                    ) : (
                      <Wand2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    )}
                    Generate AI Image
                  </button>
                )}
                {inlineGenError ? (
                  <p
                    className="text-sm font-medium text-red-700"
                    role="alert"
                  >
                    {inlineGenError}
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {(normalizedStatus === "approved" || normalizedStatus === "published") &&
        onToggleFeatured && (
          <div className="shrink-0 border-t border-neutral-200 bg-white p-4">
            <label className="flex items-center justify-between gap-3">
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-neutral-900">Featured</span>
                <span className="text-xs text-neutral-600">
                  Cold-start ordering hint: featured recipes lead Trending only while unrated.
                  Ratings always win once they exist.
                </span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={recipe.featured === true}
                disabled={isTogglingFeatured}
                onClick={() =>
                  void onToggleFeatured(String(recipe._id), !(recipe.featured === true))
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
                  recipe.featured === true ? "bg-sky-600" : "bg-neutral-300",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                    recipe.featured === true ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </label>
          </div>
        )}

      {normalizedStatus === "approved" && onPublish && (
        <div className="shrink-0 border-t border-neutral-200 bg-neutral-50/80 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => void onPublish(String(recipe._id))}
            disabled={isPublishing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublishing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />
            ) : (
              <span aria-hidden>🚀</span>
            )}
            Publish Recipe
          </button>
          {publishError ? (
            <p className="mt-2 text-center text-sm font-medium text-red-700" role="alert">
              {publishError}
            </p>
          ) : (
            <p className="mt-2 text-center text-xs text-neutral-600">
              Publishes this staging recipe and moves it to the Published tab.
            </p>
          )}
        </div>
      )}

      {normalizedStatus === "published" && onUnpublish && (
        <div className="shrink-0 border-t border-red-200 bg-red-50/90 p-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => void onUnpublish(String(recipe._id))}
            disabled={isUnpublishing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUnpublishing ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-white" strokeWidth={2.5} />
            )}
            Unpublish Recipe
          </button>
          {unpublishError ? (
            <p className="mt-2 text-center text-sm font-medium text-red-800" role="alert">
              {unpublishError}
            </p>
          ) : (
            <p className="mt-2 text-center text-xs font-medium text-red-900">
              Removes this recipe from the live app and returns it to Approved.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; classes: string }> = {
    ready_for_review: {
      label: "Review",
      classes: "bg-amber-50 text-amber-700 border-amber-200",
    },
    approved: {
      label: "Approved",
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    published: {
      label: "Published",
      classes: "bg-sky-50 text-sky-700 border-sky-200",
    },
    rejected: {
      label: "Rejected",
      classes: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const c = config[status] ?? {
    label: status,
    classes: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };

  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium",
        c.classes,
      )}
    >
      {c.label}
    </span>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-800">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

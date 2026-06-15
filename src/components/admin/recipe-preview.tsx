"use client";

import { Clock, Flame, Dumbbell, Wheat, Droplets, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  formatIngredientKcal,
  pickIngredientLineKcal,
} from "@/lib/resolved-ingredient-kcal";
import { resolveStagingRecipeTags } from "@/lib/staging-recipe-tags";
import {
  describeUnresolvedReason,
  resolveCookingInstruction,
} from "@/lib/resolve-cooking-tokens";

interface RecipeData {
  name: string;
  description?: string;
  heroImageUrl?: string;
  ingredients?: Array<{
    name?: string;
    description?: string;
    quantity?: number;
    unit?: string;
    displayString?: string;
    /** Per-quantity kcal (Orizon / FatSecret). */
    kcal?: number;
    calories?: number;
  }>;
  /** Step-by-step procedure (backend key). */
  cookingGuide?: Array<{
    stepNumber: number;
    instruction: string;
  }>;
  /** @deprecated Legacy key; shown only if `cookingGuide` is absent. */
  steps?: Array<{
    stepNumber: number;
    instruction: string;
  }>;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
}

interface StagingRecipe {
  _id: string;
  name: string;
  description?: string;
  heroImageUrl?: string;
  heroImageApproved?: boolean;
  recipeData?: RecipeData;
  expectedCalories?: number;
  expectedProtein?: number;
  expectedCarbs?: number;
  expectedFat?: number;
  computedCalories?: number;
  computedProtein?: number;
  computedCarbs?: number;
  computedFat?: number;
  nutritionReady?: boolean;
  tagsCuisine?: string[];
  tagsMealType?: string[];
  tagsDietary?: string[];
  /** FatSecret-aggregated recipe-level allergens (dietary filter triggers). */
  computedAllergens?: string[];
  /** FatSecret-aggregated ingredient categories (e.g. Poultry, Seafood). */
  computedCategories?: string[];
}

interface RecipePreviewProps {
  recipe: StagingRecipe | null;
  onApproveImage?: (id: string) => void;
  onRejectImage?: (id: string) => void;
}

function hasHeroImageUrl(recipe: StagingRecipe): boolean {
  return Boolean(recipe.heroImageUrl?.trim());
}

function stringBadgeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export function RecipePreview({
  recipe,
  onApproveImage,
  onRejectImage,
}: RecipePreviewProps) {
  if (!recipe) {
    return (
      <div className="scrollbar-hide flex h-full min-h-0 flex-col overflow-y-auto">
        <div className="flex flex-1 items-center justify-center p-6 text-sm text-neutral-500">
          Select a recipe to preview
        </div>
      </div>
    );
  }

  const data = recipe.recipeData;
  const ingredients = data?.ingredients ?? [];
  const cookingGuide = Array.isArray(data?.cookingGuide)
    ? data.cookingGuide
    : Array.isArray(data?.steps)
      ? data.steps
      : [];
  const hasHero = hasHeroImageUrl(recipe);
  const showImageActions = onApproveImage || onRejectImage;

  const displayCalories =
    recipe.computedCalories != null && Number.isFinite(recipe.computedCalories)
      ? recipe.computedCalories
      : recipe.expectedCalories;
  const displayProtein =
    recipe.computedProtein != null && Number.isFinite(recipe.computedProtein)
      ? recipe.computedProtein
      : recipe.expectedProtein;
  const displayCarbs =
    recipe.computedCarbs != null && Number.isFinite(recipe.computedCarbs)
      ? recipe.computedCarbs
      : recipe.expectedCarbs;
  const displayFat =
    recipe.computedFat != null && Number.isFinite(recipe.computedFat)
      ? recipe.computedFat
      : recipe.expectedFat;

  const resolvedTags = resolveStagingRecipeTags(recipe);
  const computedAllergens = stringBadgeList(resolvedTags.computedAllergens);
  const computedCategories = stringBadgeList(recipe.computedCategories);
  const hasAutoFoodTags =
    computedAllergens.length > 0 || computedCategories.length > 0;

  const discoveryTags = [
    ...resolvedTags.tagsCuisine,
    ...resolvedTags.tagsMealType,
    ...resolvedTags.tagsDietary,
    ...resolvedTags.tagsCookSpeed,
    ...resolvedTags.tagsSeasonality,
  ];

  return (
    <div className="scrollbar-hide flex h-full min-h-0 flex-col overflow-y-auto bg-[#0c0c0c] text-white">
      {/* Hero image area with AI feedback overlay */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-neutral-900">
        {hasHero ? (
          <img
            src={recipe.heroImageUrl}
            alt={recipe.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-neutral-600">
            No image
          </div>
        )}

        {recipe.heroImageApproved && (
          <div className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
            Approved
          </div>
        )}

        {showImageActions && (
          <div className="pointer-events-auto absolute bottom-3 right-3 flex gap-2">
            {onApproveImage && (
              <button
                type="button"
                onClick={() => hasHero && onApproveImage(recipe._id)}
                disabled={!hasHero}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all",
                  !hasHero && "pointer-events-none cursor-not-allowed opacity-40",
                  hasHero &&
                    (recipe.heroImageApproved
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-black/50 text-emerald-400 hover:bg-emerald-500/80 hover:text-white"),
                )}
                title={
                  hasHero
                    ? "Approve image"
                    : "Hero image required to approve the image"
                }
              >
                <ThumbsUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
            {onRejectImage && (
              <button
                type="button"
                onClick={() => hasHero && onRejectImage(recipe._id)}
                disabled={!hasHero}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all",
                  !hasHero && "pointer-events-none cursor-not-allowed opacity-40",
                  hasHero &&
                    "bg-black/50 text-red-400 hover:bg-red-500/80 hover:text-white",
                )}
                title={
                  hasHero
                    ? "Regenerate image"
                    : "Hero image required to reject / regenerate"
                }
              >
                <ThumbsDown className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        <h2 className="text-lg font-bold leading-tight">{recipe.name}</h2>
        {recipe.description && (
          <p className="mt-1 text-xs leading-relaxed text-neutral-400">
            {recipe.description}
          </p>
        )}

        <div className="mt-3 flex gap-3">
          {data?.prepTime && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Clock className="h-3 w-3" />
              {(data.prepTime ?? 0) + (data.cookTime ?? 0)}m
            </div>
          )}
          {data?.servings != null && data.servings > 0 && (
            <div className="text-xs text-neutral-500">
              {data.servings === 1
                ? "1 serving"
                : `${data.servings} servings`}
            </div>
          )}
        </div>

        {(displayCalories || displayProtein) && (
          <div className="mt-4 flex gap-2">
            {[
              { icon: Flame, value: displayCalories, label: "kcal", color: "text-orange-400" },
              { icon: Dumbbell, value: displayProtein, label: "g P", color: "text-emerald-400" },
              { icon: Wheat, value: displayCarbs, label: "g C", color: "text-blue-400" },
              { icon: Droplets, value: displayFat, label: "g F", color: "text-amber-400" },
            ]
              .filter((m) => m.value != null)
              .map((macro) => (
                <div
                  key={macro.label}
                  className="flex flex-1 flex-col items-center rounded-xl bg-white/5 py-2"
                >
                  <macro.icon className={`h-3 w-3 ${macro.color}`} />
                  <span className="mt-1 text-xs font-semibold">
                    {Math.round(macro.value!)}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {macro.label}
                  </span>
                </div>
              ))}
          </div>
        )}

        {discoveryTags.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
              Discovery tags
            </h3>
            <p className="mb-2 text-[10px] leading-snug text-neutral-600">
              Cuisine, meal type, diet, cook speed &amp; seasonality (document or
              recipeData)
            </p>
            <div className="flex flex-wrap gap-1">
              {discoveryTags.map((tag, i) => (
                <span
                  key={`discovery-${i}-${tag}`}
                  className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {hasAutoFoodTags && (
          <div className="mt-4 rounded-xl border border-violet-500/25 bg-violet-950/20 p-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-violet-200/90">
              Allergies &amp; food tags (auto-detected)
            </h3>
            <p className="mt-0.5 text-[10px] leading-snug text-neutral-500">
              From FatSecret aggregation — what dietary filters will match.
            </p>
            {computedAllergens.length > 0 && (
              <div className="mt-2.5">
                <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-orange-300/90">
                  Allergens
                </p>
                <div className="flex flex-wrap gap-1">
                  {computedAllergens.map((tag) => (
                    <span
                      key={`allergen-${tag}`}
                      className="rounded-full border border-orange-500/55 bg-orange-950/50 px-2 py-0.5 text-[10px] font-medium text-orange-100 shadow-sm shadow-orange-900/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {computedCategories.length > 0 && (
              <div className="mt-2.5">
                <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-sky-300/80">
                  Categories
                </p>
                <div className="flex flex-wrap gap-1">
                  {computedCategories.map((tag) => (
                    <span
                      key={`cat-${tag}`}
                      className="rounded-full border border-sky-500/45 bg-sky-950/20 px-2 py-0.5 text-[10px] text-sky-100/90"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Ingredients
            </h3>
            <div className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 border-b border-white/10 px-1 pb-1 text-[9px] font-semibold uppercase tracking-wide text-neutral-500">
              <span>Ingredient</span>
              <span className="text-right">Qty</span>
            </div>
            <div className="space-y-1.5">
              {ingredients.map((ing, i) => {
                const qtyLabel =
                  ing.quantity != null
                    ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ""}`
                    : "—";
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 rounded-lg bg-white/5 px-2 py-2"
                  >
                    <span className="min-w-0 text-[11px] leading-snug text-neutral-200">
                      {ing.displayString || ing.description || ing.name}
                    </span>
                    <span className="shrink-0 text-right text-[10px] tabular-nums text-neutral-500">
                      {qtyLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {cookingGuide.length > 0 && (
          <div className="mt-5 pb-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Cooking Guide
              <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
                admin-resolved
              </span>
            </h3>
            <div className="space-y-3">
              {cookingGuide.map((step) => {
                const segments = resolveCookingInstruction(
                  step.instruction,
                  data?.ingredients ?? [],
                );
                return (
                  <div key={step.stepNumber} className="flex gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold">
                      {step.stepNumber}
                    </div>
                    <p className="text-xs leading-relaxed text-neutral-300">
                      {segments.length === 0 ? (
                        step.instruction
                      ) : (
                        segments.map((seg, i) => {
                          if (seg.kind === "text") {
                            return (
                              <span key={`t-${i}`}>{seg.text}</span>
                            );
                          }
                          if (seg.kind === "resolved") {
                            return (
                              <span
                                key={`r-${i}`}
                                className="mx-0.5 rounded bg-emerald-500/15 px-1 text-[11px] font-semibold tabular-nums text-emerald-300"
                                title={`Resolved from ingredient #${seg.ingredientIndex + 1} (${seg.token})`}
                              >
                                {seg.text}
                              </span>
                            );
                          }
                          return (
                            <span
                              key={`u-${i}`}
                              className="mx-0.5 rounded bg-rose-500/20 px-1 font-mono text-[11px] font-semibold text-rose-300"
                              title={describeUnresolvedReason(seg.reason)}
                            >
                              {seg.text}
                            </span>
                          );
                        })
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

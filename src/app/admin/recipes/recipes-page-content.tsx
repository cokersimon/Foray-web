"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSupabaseSession } from "@/components/providers";
import {
  chefAdmin,
  pollJob,
  toLegacyDetail,
  toLegacySummary,
  type ChefStagingRecipe,
  type LegacyStagingDetail,
  type LegacyStagingSummary,
} from "@/lib/chef-api";
import {
  RecipeList,
  type IngestJobCard,
} from "@/components/admin/recipe-list";
import { RecipeEditor } from "@/components/admin/recipe-editor";
import { RecipePreview } from "@/components/admin/recipe-preview";
import { IPhoneMockup } from "@/components/admin/iphone-mockup";
import { RecipeCopilotSidebar } from "@/components/admin/recipe-copilot-sidebar";

type RecipeStatus = "ready_for_review" | "approved" | "published";

type ChefJobListRow = {
  id: string;
  kind: string;
  status: string;
  stage: string | null;
  error: string | null;
  createdAt: number;
};
type IngredientEditPatch = {
  name?: string;
  quantity?: number;
  unit?: string;
};
type CookingToken = {
  type: "text" | "ingredient" | "quantity" | "time" | "temperature";
  value: string | number;
  unit?: string;
  ingredientRef?: string;
  ingredientIndex?: number;
  scale?: "linear" | "static";
  timerEnabled?: boolean;
};
type CookingGuideStep = {
  stepNumber: number;
  instruction: string;
  tokens: CookingToken[];
};

/** List poll cadence — staging rows appear as chef jobs complete (ADR-019 async ingest). */
const LIST_POLL_MS = 5000;

/**
 * Humanise the `chef.publish_recipe` gate errors into a blocking validation message the admin can
 * act on. The gates fail the whole publish (one SQL transaction), so the recipe must be fixed and
 * re-run — these messages say what is missing. `PUBLISH_MISSING_LINE_MACROS` mirrors the app's
 * `hasFullMacroCoverage`: every ingredient line must carry its own per-line macros, or the recipe
 * would pass publish yet fail every macro-range filter on device (ADR-018 macro-accuracy gate).
 */
function humanizePublishError(message: string): string {
  const code = message.split(":", 1)[0]?.trim() ?? "";
  switch (code) {
    case "PUBLISH_MISSING_LINE_MACROS":
      return "Can't publish: one or more ingredient lines are missing per-line macros. Every line needs its own kcal/protein/carbs/fat (re-run nutrition), or this recipe would be hidden from every macro filter in the app.";
    case "PUBLISH_UNENRICHED_INGREDIENTS":
      return "Can't publish: one or more ingredient lines are missing enrichment (aisle / schema). Re-run ingredient enrichment.";
    case "PUBLISH_ALLERGEN_CHECK_MISSING":
      return "Can't publish: the allergen scan hasn't run. Refresh nutrition/allergens first.";
    case "PUBLISH_NO_NUTRITION":
      return "Can't publish: computed nutrition is missing or zero. Refresh nutrition.";
    case "PUBLISH_UNTOKENIZED_STEPS":
      return "Can't publish: one or more steps have no tokens. Regenerate the tokenized steps.";
    case "PUBLISH_HERO_NOT_APPROVED":
      return "Can't publish: the hero image isn't approved yet.";
    case "PUBLISH_NO_INGREDIENTS":
      return "Can't publish: this recipe has no ingredients.";
    case "PUBLISH_NO_STEPS":
      return "Can't publish: this recipe has no steps.";
    default:
      return message;
  }
}

function RecipesPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSupabaseSession();

  const [statusFilter, setStatusFilter] =
    useState<RecipeStatus>("ready_for_review");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recipes, setRecipes] = useState<LegacyStagingSummary[] | undefined>(undefined);
  const [selectedRecipe, setSelectedRecipe] = useState<
    LegacyStagingDetail | null | undefined
  >(undefined);
  const [listVersion, setListVersion] = useState(0);
  const [detailVersion, setDetailVersion] = useState(0);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRefreshingNutrition, setIsRefreshingNutrition] = useState(false);
  const [optimisticDeletedStagingIds, setOptimisticDeletedStagingIds] =
    useState<Set<string>>(() => new Set());
  const [deletingStagingId, setDeletingStagingId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [unpublishError, setUnpublishError] = useState<string | null>(null);
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [isTogglingFeatured, setIsTogglingFeatured] = useState(false);
  const [updatingApprovedIngredientIndex, setUpdatingApprovedIngredientIndex] =
    useState<number | null>(null);
  const [deletingIngredientIndex, setDeletingIngredientIndex] = useState<
    number | null
  >(null);
  const [isSavingCookingGuide, setIsSavingCookingGuide] = useState(false);
  const [isSavingTags, setIsSavingTags] = useState(false);
  const [regeneratingCookingStepIndex, setRegeneratingCookingStepIndex] =
    useState<number | null>(null);
  const [ingestJobs, setIngestJobs] = useState<IngestJobCard[]>([]);
  const [ingestJobActionId, setIngestJobActionId] = useState<string | null>(
    null,
  );
  const [jobsVersion, setJobsVersion] = useState(0);

  const refreshList = useCallback(() => setListVersion((v) => v + 1), []);
  const refreshDetail = useCallback(() => setDetailVersion((v) => v + 1), []);
  const refreshJobs = useCallback(() => setJobsVersion((v) => v + 1), []);

  useEffect(() => {
    setPublishError(null);
    setDeleteError(null);
    setUnpublishError(null);
  }, [selectedId]);

  useEffect(() => {
    const fromQuery = searchParams.get("stagingId");
    if (fromQuery?.trim()) {
      setSelectedId(fromQuery.trim());
      router.replace("/admin/recipes", { scroll: false });
    }
  }, [searchParams, router]);

  // List: fetch + poll (replaces Convex reactive useQuery).
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { recipes: rows } = await chefAdmin<{ recipes: ChefStagingRecipe[] }>(
          "staging.list",
          { status: statusFilter },
        );
        if (!cancelled) setRecipes(rows.map(toLegacySummary));
      } catch (e) {
        console.warn("staging.list failed", e);
      }
    };
    void load();
    const timer = setInterval(load, LIST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isAuthenticated, statusFilter, listVersion]);

  // Ingest jobs: only relevant on Review (progress + error cards).
  useEffect(() => {
    if (!isAuthenticated || statusFilter !== "ready_for_review") {
      setIngestJobs([]);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const { jobs } = await chefAdmin<{ jobs: ChefJobListRow[] }>("jobs.list", {
          limit: 50,
        });
        if (cancelled) return;
        const cards: IngestJobCard[] = jobs
          .filter(
            (j) =>
              j.kind === "ingest" &&
              (j.status === "queued" ||
                j.status === "running" ||
                j.status === "error"),
          )
          .map((j) => ({
            id: j.id,
            status: j.status as IngestJobCard["status"],
            stage: j.stage,
            error: j.error,
            createdAt: j.createdAt,
          }));
        setIngestJobs(cards);
      } catch (e) {
        console.warn("jobs.list failed", e);
      }
    };
    void load();
    const timer = setInterval(load, LIST_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [isAuthenticated, statusFilter, jobsVersion]);

  // Detail: fetch on selection / explicit refresh.
  useEffect(() => {
    if (!isAuthenticated || !selectedId) {
      setSelectedRecipe(undefined);
      return;
    }
    let cancelled = false;
    setSelectedRecipe(undefined);
    chefAdmin<{ recipe: ChefStagingRecipe }>("staging.get", { stagingId: selectedId })
      .then(({ recipe }) => {
        if (!cancelled) setSelectedRecipe(toLegacyDetail(recipe));
      })
      .catch(() => {
        if (!cancelled) setSelectedRecipe(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, selectedId, detailVersion]);

  useEffect(() => {
    if (!recipes) return;
    setOptimisticDeletedStagingIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of prev) {
        if (!recipes.some((r) => r._id === id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [recipes]);

  const visibleRecipes = recipes?.filter(
    (r) => !optimisticDeletedStagingIds.has(r._id),
  );

  const handleApprove = useCallback(
    async (id: string) => {
      setIsApproving(true);
      try {
        await chefAdmin("staging.approve", { stagingId: id });
        setSelectedId(null);
        refreshList();
      } finally {
        setIsApproving(false);
      }
    },
    [refreshList],
  );

  const handleReject = useCallback(
    async (id: string, notes?: string) => {
      setIsRejecting(true);
      try {
        await chefAdmin("staging.reject", { stagingId: id, reason: notes });
        setSelectedId(null);
        refreshList();
      } finally {
        setIsRejecting(false);
      }
    },
    [refreshList],
  );

  const handleRefreshNutrition = useCallback(
    async (id: string) => {
      setIsRefreshingNutrition(true);
      try {
        await chefAdmin("staging.recomputeNutrition", { stagingId: id });
        refreshDetail();
      } finally {
        setIsRefreshingNutrition(false);
      }
    },
    [refreshDetail],
  );

  const handleUpdateApprovedIngredient = useCallback(
    async (stagingId: string, ingredientIndex: number, patch: IngredientEditPatch) => {
      setUpdatingApprovedIngredientIndex(ingredientIndex);
      try {
        await chefAdmin("staging.updateIngredient", {
          stagingId,
          ingredientIndex,
          ...patch,
        });
        refreshDetail();
      } finally {
        setUpdatingApprovedIngredientIndex(null);
      }
    },
    [refreshDetail],
  );

  const handleDeleteIngredient = useCallback(
    async (stagingId: string, ingredientIndex: number) => {
      setDeletingIngredientIndex(ingredientIndex);
      try {
        await chefAdmin("staging.deleteIngredient", { stagingId, ingredientIndex });
        refreshDetail();
      } finally {
        setDeletingIngredientIndex(null);
      }
    },
    [refreshDetail],
  );

  const handleUpdateCookingGuide = useCallback(
    async (stagingId: string, cookingGuide: CookingGuideStep[]) => {
      setIsSavingCookingGuide(true);
      try {
        await chefAdmin("staging.updateCookingGuide", { stagingId, cookingGuide });
        refreshDetail();
      } finally {
        setIsSavingCookingGuide(false);
      }
    },
    [refreshDetail],
  );

  const handleUpdateTags = useCallback(
    async (
      stagingId: string,
      patch: { tags?: string[]; dietaryLabels?: string[]; allergenFlags?: string[] },
    ) => {
      setIsSavingTags(true);
      try {
        await chefAdmin("staging.update", { stagingId, patch });
        refreshDetail();
      } finally {
        setIsSavingTags(false);
      }
    },
    [refreshDetail],
  );

  const handleRegenerateCookingStepTokens = useCallback(
    async (
      stagingId: string,
      stepIndex: number,
      instruction: string,
    ): Promise<CookingToken[]> => {
      setRegeneratingCookingStepIndex(stepIndex);
      try {
        const { tokens } = await chefAdmin<{ tokens: CookingToken[] }>(
          "staging.regenerateStepTokens",
          { stagingId, stepIndex, instruction },
        );
        return tokens;
      } finally {
        setRegeneratingCookingStepIndex(null);
      }
    },
    [],
  );

  const handleApproveImage = useCallback(
    async (id: string) => {
      await chefAdmin("hero.approve", { stagingId: id, approved: true });
      refreshDetail();
    },
    [refreshDetail],
  );

  // "Reject image" = regenerate the hero (job; the detail refresh shows pending → ready).
  const handleRejectImage = useCallback(
    async (id: string) => {
      const { jobId } = await chefAdmin<{ jobId: string }>("hero.regenerate", {
        stagingId: id,
      });
      refreshDetail();
      void pollJob(jobId)
        .catch(() => undefined)
        .finally(refreshDetail);
    },
    [refreshDetail],
  );

  const handleRequestHeroImageGeneration = useCallback(
    async (id: string) => {
      const { jobId } = await chefAdmin<{ jobId: string }>("hero.regenerate", {
        stagingId: id,
      });
      refreshDetail();
      const job = await pollJob(jobId);
      if (job.status === "error") {
        throw new Error(job.error ?? "Image generation failed");
      }
      refreshDetail();
    },
    [refreshDetail],
  );

  // Publish is async (hero variants + the publish_recipe TX) — poll the job (ADR-019).
  const handlePublish = useCallback(
    async (id: string) => {
      setPublishError(null);
      setIsPublishing(true);
      try {
        const { jobId } = await chefAdmin<{ jobId: string }>("publish", {
          stagingId: id,
        });
        const job = await pollJob(jobId);
        if (job.status === "error") {
          throw new Error(job.error ?? "Publish failed");
        }
        setSelectedId(null);
        refreshList();
      } catch (e) {
        const raw =
          e instanceof Error ? e.message : "Publish failed — check the chef job logs";
        setPublishError(humanizePublishError(raw));
      } finally {
        setIsPublishing(false);
      }
    },
    [refreshList],
  );

  const handleUnpublish = useCallback(
    async (id: string) => {
      if (
        !window.confirm(
          "Unpublish this recipe? It is archived in the app (existing plans keep working, Explore hides it) and returns to Approved.",
        )
      ) {
        return;
      }
      setUnpublishError(null);
      setIsUnpublishing(true);
      try {
        await chefAdmin("unpublish", { stagingId: id });
        setSelectedId(null);
        setStatusFilter("approved");
        refreshList();
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Unpublish failed — check the chef job logs";
        setUnpublishError(msg);
      } finally {
        setIsUnpublishing(false);
      }
    },
    [refreshList],
  );

  const handleToggleFeatured = useCallback(
    async (id: string, featured: boolean) => {
      setIsTogglingFeatured(true);
      try {
        await chefAdmin("staging.update", { stagingId: id, patch: { featured } });
        refreshDetail();
        refreshList();
      } catch (e) {
        console.error("toggle featured failed", e);
      } finally {
        setIsTogglingFeatured(false);
      }
    },
    [refreshDetail, refreshList],
  );

  const handleRetryIngestJob = useCallback(
    async (jobId: string) => {
      setIngestJobActionId(jobId);
      try {
        await chefAdmin("jobs.retry", { jobId });
        refreshJobs();
      } catch (e) {
        console.error("jobs.retry failed", e);
        window.alert(
          e instanceof Error ? e.message : "Could not retry ingest job.",
        );
      } finally {
        setIngestJobActionId(null);
      }
    },
    [refreshJobs],
  );

  const handleDismissIngestJob = useCallback(
    async (jobId: string) => {
      setIngestJobActionId(jobId);
      try {
        await chefAdmin("jobs.dismiss", { jobId });
        setIngestJobs((prev) => prev.filter((j) => j.id !== jobId));
        refreshJobs();
      } catch (e) {
        console.error("jobs.dismiss failed", e);
        window.alert(
          e instanceof Error ? e.message : "Could not dismiss ingest job.",
        );
      } finally {
        setIngestJobActionId(null);
      }
    },
    [refreshJobs],
  );

  const handleDeleteStagingRecipe = useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this recipe?")) {
        return;
      }
      setDeleteError(null);
      setOptimisticDeletedStagingIds((s) => new Set(s).add(id));
      if (selectedId === id) setSelectedId(null);
      setDeletingStagingId(id);
      try {
        await chefAdmin("staging.delete", { stagingId: id });
        refreshList();
      } catch (e) {
        setOptimisticDeletedStagingIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
        const msg =
          e instanceof Error ? e.message : "Delete failed — check the chef job logs";
        setDeleteError(msg);
      } finally {
        setDeletingStagingId(null);
      }
    },
    [selectedId, refreshList],
  );

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-h-0 w-[min(52%,36rem)] flex-1 flex-col border-r border-neutral-200 lg:max-w-[55%]">
        {selectedId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center gap-2 border-b border-neutral-200 px-4 py-3">
              <button
                onClick={() => setSelectedId(null)}
                type="button"
                className="text-sm font-medium text-neutral-800 underline-offset-4 transition-colors hover:text-neutral-900 hover:underline"
              >
                &larr; Back to list
              </button>
            </div>
            {selectedRecipe === undefined ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 p-8 text-sm text-neutral-600">
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
                Loading recipe…
              </div>
            ) : selectedRecipe === null ? (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8 text-sm text-neutral-700">
                Recipe not found or was removed.
              </div>
            ) : (
              <RecipeEditor
                recipe={selectedRecipe as never}
                onApprove={handleApprove}
                onReject={handleReject}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                publishError={publishError}
                unpublishError={unpublishError}
                onToggleFeatured={handleToggleFeatured}
                isTogglingFeatured={isTogglingFeatured}
                onDeleteStagingRecipe={handleDeleteStagingRecipe}
                deletingStagingId={deletingStagingId}
                deleteError={deleteError}
                onRefreshNutrition={handleRefreshNutrition}
                onRequestHeroImageGeneration={handleRequestHeroImageGeneration}
                isApproving={isApproving}
                isRejecting={isRejecting}
                isPublishing={isPublishing}
                isUnpublishing={isUnpublishing}
                isRefreshingNutrition={isRefreshingNutrition}
                onUpdateApprovedIngredient={handleUpdateApprovedIngredient}
                updatingApprovedIngredientIndex={updatingApprovedIngredientIndex}
                onDeleteIngredient={handleDeleteIngredient}
                deletingIngredientIndex={deletingIngredientIndex}
                onUpdateCookingGuide={handleUpdateCookingGuide}
                onRegenerateCookingStepTokens={handleRegenerateCookingStepTokens}
                isSavingCookingGuide={isSavingCookingGuide}
                regeneratingCookingStepIndex={regeneratingCookingStepIndex}
                onUpdateTags={handleUpdateTags}
                isSavingTags={isSavingTags}
              />
            )}
          </div>
        ) : (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {deleteError ? (
              <div
                className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
                role="alert"
              >
                {deleteError}
              </div>
            ) : null}
            <RecipeList
              recipes={
                authLoading || !isAuthenticated ? undefined : (visibleRecipes as never)
              }
              selectedId={selectedId}
              onSelect={setSelectedId}
              statusFilter={statusFilter}
              onStatusChange={(s) => {
                setStatusFilter(s);
                setSelectedId(null);
                setDeleteError(null);
                setRecipes(undefined);
              }}
              onDeleteStagingRecipe={handleDeleteStagingRecipe}
              deletingStagingId={deletingStagingId}
              ingestJobs={ingestJobs}
              onRetryIngestJob={handleRetryIngestJob}
              onDismissIngestJob={handleDismissIngestJob}
              ingestJobActionId={ingestJobActionId}
            />
          </div>
        )}
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-row bg-neutral-100 [container-type:size]">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col p-4 pr-0 sm:p-6 sm:pr-0">
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <IPhoneMockup className="h-full w-full min-h-0 max-w-[28rem]">
              {selectedId && selectedRecipe === undefined ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#0c0c0c] p-6 text-sm text-neutral-500">
                  <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-neutral-600 border-t-neutral-300" />
                  Loading preview…
                </div>
              ) : (
                <RecipePreview
                  recipe={(selectedRecipe ?? null) as never}
                  onApproveImage={handleApproveImage}
                  onRejectImage={handleRejectImage}
                />
              )}
            </IPhoneMockup>
          </div>
        </div>
        <RecipeCopilotSidebar stagingId={selectedId} />
      </div>
    </div>
  );
}

export function RecipesPageContent() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-sm text-neutral-600">
          Loading recipes…
        </div>
      }
    >
      <RecipesPageInner />
    </Suspense>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, ArrowLeft, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSupabaseSession } from "@/components/providers";
import { chefAdmin, chefIngest, pollJob } from "@/lib/chef-api";

/** Fallback while `chef.ingestion_defaults` has not loaded yet. */
const FALLBACK_PARSING_PROMPT =
  "You are an expert nutritionist and culinary editor. Extract this recipe into strict JSON. Normalise to exactly one serving when the text states a yield. Use minimal ingredient search names (e.g. 'chicken breast'). Never invent nutrition numbers not present in the source.";

const FALLBACK_IMAGE_INSTRUCTION =
  "Photorealistic food photography, 45-degree angle, bright natural kitchen lighting, highly appetising.";

type SaveFlash = "parsing" | "image" | null;
type IngestMode = "source" | "generate";

const GENERATION_PROMPT_PLACEHOLDER =
  "e.g., Generate 5 quick-cook, high-protein Mediterranean dinners.";

type IngestionDefaults = {
  parsingPrompt?: string | null;
  imageInstructionPrompt?: string | null;
} | null;

export default function RecipeIngestPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSupabaseSession();

  const [defaults, setDefaults] = useState<IngestionDefaults | undefined>(
    undefined,
  );
  const [rawText, setRawText] = useState("");
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [mode, setMode] = useState<IngestMode>("source");
  const [parsingPrompt, setParsingPrompt] = useState(FALLBACK_PARSING_PROMPT);
  const [imageInstructionPrompt, setImageInstructionPrompt] = useState(
    FALLBACK_IMAGE_INSTRUCTION,
  );
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void chefAdmin<{ defaults: IngestionDefaults }>("defaults.get")
      .then(({ defaults: row }) => {
        if (!cancelled) setDefaults(row);
      })
      .catch(() => {
        if (!cancelled) setDefaults(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (defaults === undefined) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (defaults?.parsingPrompt) setParsingPrompt(defaults.parsingPrompt);
    if (defaults?.imageInstructionPrompt) {
      setImageInstructionPrompt(defaults.imageInstructionPrompt);
    }
  }, [defaults]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingParsing, setIsSavingParsing] = useState(false);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveFlash, setSaveFlash] = useState<SaveFlash>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaveFlash = useCallback((which: SaveFlash) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setSaveFlash(which);
    flashTimerRef.current = setTimeout(() => {
      setSaveFlash(null);
      flashTimerRef.current = null;
    }, 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const handleSaveParsingDefault = useCallback(async () => {
    setError(null);
    const text = parsingPrompt.trim();
    if (!text) {
      setError("Parsing instructions cannot be empty.");
      return;
    }
    setIsSavingParsing(true);
    try {
      await chefAdmin("defaults.set", { parsingPrompt: text });
      showSaveFlash("parsing");
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Could not save parsing default.",
      );
    } finally {
      setIsSavingParsing(false);
    }
  }, [parsingPrompt, showSaveFlash]);

  const handleSaveImageDefault = useCallback(async () => {
    setError(null);
    const text = imageInstructionPrompt.trim();
    if (!text) {
      setError("Image style instructions cannot be empty.");
      return;
    }
    setIsSavingImage(true);
    try {
      await chefAdmin("defaults.set", { imageInstructionPrompt: text });
      showSaveFlash("image");
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : "Could not save image default.",
      );
    } finally {
      setIsSavingImage(false);
    }
  }, [imageInstructionPrompt, showSaveFlash]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    const activeText = mode === "generate" ? generationPrompt : rawText;
    const trimmed = activeText.trim();
    if (!trimmed) {
      setError(
        mode === "generate"
          ? "Please enter a generation prompt before processing."
          : "Please paste raw recipe text before processing.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const { jobId } = await chefIngest({
        rawText: trimmed,
        parsingPrompt: parsingPrompt.trim() || FALLBACK_PARSING_PROMPT,
        imageInstructionPrompt:
          imageInstructionPrompt.trim() || FALLBACK_IMAGE_INSTRUCTION,
      });
      const job = await pollJob(jobId);
      if (job.status === "error") {
        setError(job.error ?? "The chef job failed — check the jobs list.");
        return;
      }
      const ids = Array.isArray(job.result?.stagingIds)
        ? (job.result.stagingIds as string[]).filter(Boolean)
        : [];
      if (ids.length > 1 || ids.length === 0) {
        router.push("/admin/recipes");
        return;
      }
      router.push(`/admin/recipes?stagingId=${encodeURIComponent(ids[0])}`);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    rawText,
    generationPrompt,
    mode,
    parsingPrompt,
    imageInstructionPrompt,
    router,
  ]);

  const defaultsLoading = authLoading || !isAuthenticated || defaults === undefined;
  const isGenerateMode = mode === "generate";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#fafafa]">
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <Link
          href="/admin/recipes"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to staging list
        </Link>
        <h1 className="mt-3 text-xl font-bold text-neutral-900">
          AI recipe ingest
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {isGenerateMode
            ? "Prompt Gemini to generate pantry-aware recipe batches for review."
            : "Paste unstructured recipe text. We'll parse it with Gemini and open it in the review queue."}
        </p>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 p-6">
        <div className="mb-6 inline-flex rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("source")}
            disabled={isSubmitting}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              mode === "source"
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-700 hover:bg-neutral-50",
            )}
          >
            Ingest Source
          </button>
          <button
            type="button"
            onClick={() => setMode("generate")}
            disabled={isSubmitting}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              mode === "generate"
                ? "bg-neutral-900 text-white shadow-sm"
                : "text-neutral-700 hover:bg-neutral-50",
            )}
          >
            Generate Batch
          </button>
        </div>

        {error ? (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="raw-recipe-text"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-800"
            >
              {isGenerateMode ? "Generation prompt" : "Raw recipe text"}
            </label>
            <textarea
              id="raw-recipe-text"
              value={isGenerateMode ? generationPrompt : rawText}
              onChange={(e) =>
                isGenerateMode
                  ? setGenerationPrompt(e.target.value)
                  : setRawText(e.target.value)
              }
              rows={20}
              placeholder={
                isGenerateMode
                  ? GENERATION_PROMPT_PLACEHOLDER
                  : "Paste the full recipe here (title, ingredients, cooking guide, notes)…"
              }
              className="min-h-[320px] w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="parsing-prompt"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-800"
                >
                  Parsing instructions
                </label>
                <div className="flex items-center gap-2">
                  {saveFlash === "parsing" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Saved!
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSaveParsingDefault}
                    disabled={
                      isSubmitting ||
                      isSavingParsing ||
                      defaultsLoading
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Save current text as default for all admins"
                  >
                    {isSavingParsing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" strokeWidth={2.5} />
                    )}
                    Save as default
                  </button>
                </div>
              </div>
              <textarea
                id="parsing-prompt"
                value={parsingPrompt}
                onChange={(e) => setParsingPrompt(e.target.value)}
                rows={8}
                className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                disabled={isSubmitting || defaultsLoading}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="image-instruction"
                  className="text-xs font-semibold uppercase tracking-wider text-neutral-800"
                >
                  Image style instructions
                </label>
                <div className="flex items-center gap-2">
                  {saveFlash === "image" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Saved!
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleSaveImageDefault}
                    disabled={
                      isSubmitting ||
                      isSavingImage ||
                      defaultsLoading
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Save current text as default for all admins"
                  >
                    {isSavingImage ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" strokeWidth={2.5} />
                    )}
                    Save as default
                  </button>
                </div>
              </div>
              <textarea
                id="image-instruction"
                value={imageInstructionPrompt}
                onChange={(e) => setImageInstructionPrompt(e.target.value)}
                rows={5}
                className="w-full resize-y rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                disabled={isSubmitting || defaultsLoading}
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || defaultsLoading}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:self-start lg:px-8",
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  {isGenerateMode ? "Generating…" : "Processing…"}
                </>
              ) : (
                isGenerateMode ? "Generate Recipes" : "Process with AI"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

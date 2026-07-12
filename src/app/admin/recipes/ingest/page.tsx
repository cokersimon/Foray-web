"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, ArrowLeft, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSupabaseSession } from "@/components/providers";
import { chefAdmin, chefIngest } from "@/lib/chef-api";

/** Fallback while `chef.ingestion_defaults` has not loaded yet. */
const FALLBACK_PARSING_PROMPT =
  "You are an expert nutritionist and culinary editor. Extract this recipe into strict JSON. Normalise to exactly one serving when the text states a yield. Use minimal ingredient search names (e.g. 'chicken breast'). Never invent nutrition numbers not present in the source.";

const FALLBACK_IMAGE_INSTRUCTION =
  "Professional photorealistic food photography, fully cooked and beautifully plated on a clean kitchen surface with soft natural light. Appetising restrained plating. Keep the plate and surrounding surface completely bare and clean. Do not scatter loose ingredients, herbs, or raw garnishes anywhere in the frame. All ingredients must be strictly contained within the food itself. 3D isometric framing, professional studio lighting, clean matte textures, centered composition.";

type SaveFlash = "parsing" | "image" | null;

type IngestionDefaults = {
  parsingPrompt?: string | null;
  imageInstructionPrompt?: string | null;
} | null;

export default function RecipeIngestPage() {
  const { isAuthenticated, isLoading: authLoading } = useSupabaseSession();

  const [defaults, setDefaults] = useState<IngestionDefaults | undefined>(
    undefined,
  );
  const [rawText, setRawText] = useState("");
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
  const [queuedFlash, setQueuedFlash] = useState(false);
  const [saveFlash, setSaveFlash] = useState<SaveFlash>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queuedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaveFlash = useCallback((which: SaveFlash) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setSaveFlash(which);
    flashTimerRef.current = setTimeout(() => {
      setSaveFlash(null);
      flashTimerRef.current = null;
    }, 2500);
  }, []);

  const showQueuedFlash = useCallback(() => {
    if (queuedTimerRef.current) clearTimeout(queuedTimerRef.current);
    setQueuedFlash(true);
    queuedTimerRef.current = setTimeout(() => {
      setQueuedFlash(false);
      queuedTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (queuedTimerRef.current) clearTimeout(queuedTimerRef.current);
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
    const trimmed = rawText.trim();
    if (!trimmed) {
      setError("Please paste raw recipe text before processing.");
      return;
    }
    setIsSubmitting(true);
    try {
      await chefIngest({
        rawText: trimmed,
        parsingPrompt: parsingPrompt.trim() || FALLBACK_PARSING_PROMPT,
        imageInstructionPrompt:
          imageInstructionPrompt.trim() || FALLBACK_IMAGE_INSTRUCTION,
      });
      setRawText("");
      showQueuedFlash();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [rawText, parsingPrompt, imageInstructionPrompt, showQueuedFlash]);

  const defaultsLoading = authLoading || !isAuthenticated || defaults === undefined;

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
          Paste unstructured recipe text and queue it for Gemini. Progress and
          errors show under Review — you can submit another recipe immediately.
        </p>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 p-6">
        {error ? (
          <div
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {queuedFlash ? (
          <div
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            role="status"
          >
            Queued — processing under Review. You can paste the next recipe now.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="raw-recipe-text"
              className="text-xs font-semibold uppercase tracking-wider text-neutral-800"
            >
              Raw recipe text
            </label>
            <textarea
              id="raw-recipe-text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={20}
              placeholder="Paste the full recipe here (title, ingredients, cooking guide, notes)…"
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
                  Queuing…
                </>
              ) : (
                "Process with AI"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

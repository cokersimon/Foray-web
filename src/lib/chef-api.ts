"use client";

/**
 * Typed client for the Foray chef Edge Functions (ADR-019) — replaces the Convex
 * `anyApi.*` surface. All admin traffic goes through two functions:
 *
 *   chef-ingest  POST { rawText, ... }            → { jobId }  (async; poll jobs.get)
 *   chef-admin   POST { action, ...args }         → action result
 *
 * The legacy review UI (recipe editor / list / preview) consumes Orizon's staging
 * shape; `toLegacyDetail`/`toLegacySummary` adapt the new chef rows so those
 * components port with minimal change.
 */

import { supabaseBrowser } from "@/lib/supabase/client";

// ── transport ──────────────────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

function functionsUrl(name: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${name}`;
}

async function post<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(functionsUrl(fn), {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(payload.error ?? `${fn} failed (${res.status})`));
  }
  return payload as T;
}

export async function chefAdmin<T = Record<string, unknown>>(
  action: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  return post<T>("chef-admin", { action, ...args });
}

export async function chefIngest(args: {
  rawText: string;
  parsingPrompt?: string;
  imageInstructionPrompt?: string;
  sourceUrl?: string | null;
}): Promise<{ jobId: string }> {
  return post<{ jobId: string }>("chef-ingest", args);
}

// ── types (mirror chef schema rows) ────────────────────────────────────────────────────

export type ChefQuantity = { value: number; unit: string; unitClass: string };

export type ChefIngredientLine = {
  rawText: string;
  displayName: string;
  quantity: ChefQuantity;
  note?: string;
  // ADR-040 R2 embedded per-ingredient enrichment (recipe-scoped, self-contained). There is no
  // ingredient catalog: each line carries its own aisle/macros/allergens/dietary. The admin editor
  // preserves these on round-trip; a line is "resolved" when it carries embedded enrichment.
  lineId?: string;
  aisle?: string;
  lineMacros?: ChefMacros;
  allergens?: string[];
  dietaryLabels?: string[];
  schemaVersion?: number;
};

export type ChefStep = {
  index: number;
  text: string;
  durationSec?: number;
  tokens?: Array<Record<string, unknown>>;
};

export type ChefMacros = { kcal: number; protein: number; carbs: number; fat: number };

export type ChefStagingRecipe = {
  id: string;
  createdAt: number;
  lastModified: number;
  status: "ready_for_review" | "approved" | "published" | "rejected";
  sourceText: string | null;
  sourceUrl: string | null;
  model: string | null;
  jobId: string | null;
  title: string;
  description: string | null;
  steps: ChefStep[];
  ingredients: ChefIngredientLine[];
  tags: string[];
  dietaryLabels: string[];
  allergenFlags: string[];
  servingsBase: number;
  prepSec: number | null;
  cookSec: number | null;
  macros: ChefMacros | null;
  sourceReportedMacros: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  } | null;
  imagePrompt: string | null;
  heroOriginalKey: string | null;
  heroStagingKey: string | null;
  heroImageApproved: boolean;
  heroStatus: "none" | "pending" | "ready" | "error";
  heroError: string | null;
  reviewNotes: string | null;
  rejectedReason: string | null;
  liveRecipeId: string | null;
  publishedAt: number | null;
  heroPreviewUrl?: string | null;
};

export type ChefJob = {
  id: string;
  kind: "ingest" | "tokenize" | "hero_image" | "publish_assets";
  status: "queued" | "running" | "done" | "error";
  stage: string | null;
  result: Record<string, unknown> | null;
  error: string | null;
  stagingId: string | null;
};

// ── job polling (replaces Convex reactivity) ───────────────────────────────────────────

export async function pollJob(
  jobId: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<ChefJob> {
  const intervalMs = options.intervalMs ?? 2500;
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const { job } = await chefAdmin<{ job: ChefJob }>("jobs.get", { jobId });
    if (job.status === "done" || job.status === "error") return job;
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for the chef job — check the jobs list.");
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

// ── legacy adapters (Orizon staging shape expected by the review UI) ───────────────────

export type LegacyStagingSummary = {
  _id: string;
  name: string;
  status: string;
  source: string;
  heroImageUrl?: string;
  tagsMealType?: string[];
  computedCalories?: number;
  expectedCalories?: number;
  createdAt: number;
};

export type LegacyStagingDetail = LegacyStagingSummary & {
  description?: string;
  sourceUrl?: string | null;
  heroImageApproved?: boolean;
  recipeData?: Record<string, unknown>;
  tagsDietary?: string[];
  computedAllergens?: string[];
  expectedProtein?: number;
  expectedCarbs?: number;
  expectedFat?: number;
  computedProtein?: number;
  computedCarbs?: number;
  computedFat?: number;
  nutritionReady?: boolean;
  batchId?: string;
  reviewNotes?: string;
  updatedAt?: number;
  imageGenStatus?: "idle" | "pending" | "error";
  lastImageGenError?: string;
};

function legacyIngredients(lines: ChefIngredientLine[]): Array<Record<string, unknown>> {
  return lines.map((line) => ({
    name: line.displayName,
    displayString: line.displayName,
    searchName: line.displayName,
    quantity: line.quantity?.value,
    unit: line.quantity?.unit,
    rawText: line.rawText,
    // ADR-040: forward the self-contained embedded enrichment (no catalog pointer). The editor
    // preserves these on round-trip; a line is resolved when it carries this enrichment.
    ...(line.lineId ? { lineId: line.lineId } : {}),
    ...(line.aisle ? { aisle: line.aisle } : {}),
    ...(line.lineMacros ? { lineMacros: line.lineMacros } : {}),
    ...(line.allergens ? { allergens: line.allergens } : {}),
    ...(line.dietaryLabels ? { dietaryLabels: line.dietaryLabels } : {}),
    ...(line.schemaVersion != null ? { schemaVersion: line.schemaVersion } : {}),
    ...(line.note ? { note: line.note } : {}),
  }));
}

function legacyCookingGuide(steps: ChefStep[]): Array<Record<string, unknown>> {
  return steps.map((step) => ({
    stepNumber: step.index + 1,
    instruction: step.text,
    tokens: step.tokens ?? [],
  }));
}

export function toLegacySummary(r: ChefStagingRecipe): LegacyStagingSummary {
  return {
    _id: r.id,
    name: r.title,
    status: r.status,
    source: r.model ?? "chef",
    heroImageUrl: r.heroPreviewUrl ?? undefined,
    tagsMealType: r.tags,
    computedCalories: r.macros?.kcal,
    expectedCalories: r.sourceReportedMacros?.calories,
    createdAt: r.createdAt,
  };
}

export function toLegacyDetail(r: ChefStagingRecipe): LegacyStagingDetail {
  return {
    ...toLegacySummary(r),
    description: r.description ?? undefined,
    sourceUrl: r.sourceUrl,
    heroImageApproved: r.heroImageApproved,
    recipeData: {
      name: r.title,
      description: r.description ?? undefined,
      ingredients: legacyIngredients(r.ingredients),
      cookingGuide: legacyCookingGuide(r.steps),
      prepTime: r.prepSec != null ? Math.round(r.prepSec / 60) : undefined,
      cookTime: r.cookSec != null ? Math.round(r.cookSec / 60) : undefined,
      servings: r.servingsBase,
      tags: r.tags,
      dietaryLabels: r.dietaryLabels,
      imagePrompt: r.imagePrompt ?? undefined,
    },
    tagsDietary: r.dietaryLabels,
    computedAllergens: r.allergenFlags,
    expectedProtein: r.sourceReportedMacros?.protein,
    expectedCarbs: r.sourceReportedMacros?.carbs,
    expectedFat: r.sourceReportedMacros?.fat,
    computedProtein: r.macros?.protein,
    computedCarbs: r.macros?.carbs,
    computedFat: r.macros?.fat,
    nutritionReady: (r.macros?.kcal ?? 0) > 0,
    batchId: r.jobId ?? undefined,
    reviewNotes: r.reviewNotes ?? undefined,
    updatedAt: r.lastModified,
    imageGenStatus:
      r.heroStatus === "pending" ? "pending" : r.heroStatus === "error" ? "error" : "idle",
    lastImageGenError: r.heroError ?? undefined,
  };
}

// Shared types for the /admin/catalog review UI (plan Workstream C). Mirrors the chef-admin
// catalog.* action results (supabase/functions/chef-admin/index.ts).

export const STORES = [
  { domain: "sainsburys.co.uk", label: "Sainsbury's", code: "SB" },
  { domain: "tesco.com", label: "Tesco", code: "TE" },
  { domain: "waitrose.com", label: "Waitrose", code: "WA" },
] as const;

export type StoreDomain = (typeof STORES)[number]["domain"];

// v2 aisle vocab (mirror of supabase/functions/_shared/grocery-aisle-lexicon.json). Canonical value
// is the slug; AISLE_LABELS gives the display form for the table + filter dropdown.
export const AISLES = [
  "fruit-veg", "meat-fish", "dairy-chilled", "bakery", "frozen", "tins-cans",
  "pasta-rice-noodles", "cooking-oils", "herbs-spices", "condiments-sauces", "baking",
  "breakfast-cereals", "snacks-confectionery", "nuts-seeds-dried-fruit", "drinks",
  "world-foods", "household", "other",
] as const;

export const AISLE_LABELS: Record<string, string> = {
  "fruit-veg": "Fruit & Vegetables",
  "meat-fish": "Meat & Fish",
  "dairy-chilled": "Dairy, Eggs & Chilled",
  "bakery": "Bakery",
  "frozen": "Frozen",
  "tins-cans": "Tins & Cans",
  "pasta-rice-noodles": "Pasta, Rice & Noodles",
  "cooking-oils": "Cooking Ingredients & Oils",
  "herbs-spices": "Herbs, Spices & Seasoning",
  "condiments-sauces": "Condiments & Sauces",
  "baking": "Baking",
  "breakfast-cereals": "Breakfast Cereals",
  "snacks-confectionery": "Snacks, Crisps & Confectionery",
  "nuts-seeds-dried-fruit": "Nuts, Seeds & Dried Fruit",
  "drinks": "Drinks",
  "world-foods": "World Foods",
  "household": "Household",
  "other": "Other",
};

/** [slug, label] options for the aisle filter dropdown. */
export const AISLE_OPTIONS: ReadonlyArray<[string, string]> = AISLES.map(
  (a) => [a, AISLE_LABELS[a]] as [string, string],
);

export function aisleLabel(slug: string | null | undefined): string {
  if (!slug) return "—";
  return AISLE_LABELS[slug] ?? slug;
}

/** Budget tiers for the inline tier dropdown (price-derived value/mid/premium). */
export const TIER_OPTIONS = ["value", "mid", "premium"] as const;

/** A manual edit to one SKU from the review table, persisted via catalog.updateSku. */
export type SkuEdit = {
  semanticName?: string;
  aisle?: string;
  budgetTier?: string;
};

export type CatalogSkuRow = {
  id: string;
  skuRef: string;
  skuHandle: string | null;
  rawName: string;
  entityName: string | null;
  quantityStr: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  currency: string | null;
  pricePerUnit: number | null;
  pricePerUnitBase: number | null;
  aisle: string | null;
  category: string | null;
  aisleConsensus: "agreed" | "adjudicated" | "low_consensus" | null;
  aisleConfidence: number | null;
  semanticBase: string | null;
  variant: string | null;
  semanticName: string | null;
  isIngredient: boolean | null;
  budgetTier: "value" | "mid" | "premium" | null;
  tierContested: boolean;
  clusterSize: number | null;
  tierQualityCue: string | null;
  matchBand: "high" | "medium" | "unmatched" | null;
  matchConfidence: number | null;
  auditState: string;
  resolutionState: string | null;
  unitParseStatus: string | null;
  pilotSample: boolean;
  lastSeenAt: string | null;
};

export type CatalogListResponse = {
  skus: CatalogSkuRow[];
  total: number;
  limit: number;
  offset: number;
};

// ── durable import + publish gate (ADR-077) ──────────────────────────────────────────────

/** One dated catalogue version (catalog.refresh.start → catalogRefreshRun row). */
export type CatalogRefreshRun = {
  id: string;
  storeDomain: string;
  startedAt: string;
  importedAt: string | null;
  finishedAt: string | null;
  publishedAt: string | null;
  status:
    | "fetching"
    | "imported"
    | "diffing"
    | "awaiting_match"
    | "matching"
    | "ready"
    | "published"
    | "unpublished"
    | "failed";
  incoming: number | null;
  matchedSame: number | null;
  priceChanged: number | null;
  newSkus: number | null;
  droppedSkus: number | null;
  processed: number | null;
  error: string | null;
  hasRawDump: boolean;
};

export type CatalogRefreshRunsResponse = {
  runs: CatalogRefreshRun[];
  publishedRunId: string | null;
  workingRunId: string | null;
  /** Draft-version SKUs still awaiting aisle freeze or semantic match. */
  unmatched: number;
};

export type SnapshotBucket = "matched" | "new" | "historic";

export type CatalogSnapshotRow = CatalogSkuRow & {
  status: "active" | "dropped";
  bucket: SnapshotBucket;
  /** Price observed in the selected run's dump; null = the SKU wasn't in that dump (render a dash). */
  runPrice: number | null;
  runCurrency: string | null;
  runObservedAt: string | null;
};

export type CatalogSnapshotResponse = {
  runId: string | null;
  skus: CatalogSnapshotRow[];
  counts: { matched: number; new: number; historic: number };
  total: number;
  limit: number;
  offset: number;
};

export type CatalogRun = {
  id: string;
  scope: "pilot" | "full";
  status: string;
  dumpDate: string | null;
  skillVersion: string | null;
  auditSkillVersion: string | null;
  skuTotal: number;
  skuMatched: number;
  skuUnmatched: number;
  skuLowConfidence: number;
  matchRate: number | null;
  unmatchedRate: number | null;
  lowConfidenceRate: number | null;
  auditAgreementRate: number | null;
  bandShare: { high?: number; medium?: number; unmatched?: number } | null;
  needsReviewReason: string | null;
  startedAt: string;
  completedAt: string | null;
};

export type CatalogAisleAuditRow = {
  aisle: string;
  candidateCount: number;
  agreementRate: number | null;
  tick: boolean;
  thinAisleFlag: boolean;
  verdict: string | null;
  matcherNotes: string | null;
};

export type CatalogRunStats = {
  runs: CatalogRun[];
  aisles: CatalogAisleAuditRow[];
  counts: {
    total: number;
    matched: number;
    aisleFrozen: number;
    pilot: number;
    lowConsensus: number;
    autoResolved: number;
  };
};

export type CatalogAuditEntry = {
  field: string;
  matcherValue: string | null;
  auditorValue: string | null;
  adjudicatorValue: string | null;
  iterations: number;
  resolution: string | null;
  resolutionState: string | null;
  createdAt: string;
};

export type PriceObservation = {
  price: number;
  currency: string;
  pricePerUnit: number | null;
  promo: Record<string, unknown> | null;
  observedAt: string;
};

export type CatalogDetail = {
  sku: CatalogSkuRow & Record<string, unknown>;
  audit: CatalogAuditEntry[];
  aisleAudit: {
    aisle: string;
    matcherNotes: string | null;
    auditorFindings: string | null;
    verdict: string | null;
    candidateCount: number;
    agreementRate: number | null;
    thinAisleFlag: boolean;
  } | null;
  priceHistory: PriceObservation[];
};

export type SkillDocs = {
  matcher: { version: string; text: string };
  auditor: { version: string; text: string };
};

export function fmtPence(p: number | null | undefined, currency = "GBP"): string {
  if (p == null) return "—";
  const symbol = currency === "GBP" ? "£" : "";
  return `${symbol}${(p / 100).toFixed(2)}`;
}

export function fmtDate(s: string | number | null | undefined): string {
  if (s == null) return "—";
  const d = typeof s === "number" ? new Date(s) : new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

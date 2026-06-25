// Shared types for the /admin/catalog review UI (plan Workstream C). Mirrors the chef-admin
// catalog.* action results (supabase/functions/chef-admin/index.ts).

export const STORES = [
  { domain: "sainsburys.co.uk", label: "Sainsbury's", code: "SB" },
  { domain: "tesco.com", label: "Tesco", code: "TE" },
  { domain: "waitrose.com", label: "Waitrose", code: "WA" },
] as const;

export type StoreDomain = (typeof STORES)[number]["domain"];

export const AISLES = [
  "dairy", "produce", "protein", "grains", "oils", "frozen",
  "canned", "beverages", "snacks", "household", "other",
] as const;

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

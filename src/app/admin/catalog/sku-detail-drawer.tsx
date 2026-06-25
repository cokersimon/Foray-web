"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { cn } from "@/lib/cn";
import { type CatalogDetail, type CatalogSkuRow, fmtDate, fmtPence } from "./types";

/**
 * SKU detail drawer (plan C3) — the full audit trail for one SKU: matcher output, the auditor's
 * vocab-independent variant, every field disagreement (matcher vs auditor vs adjudicator), the aisle
 * consensus, tier/unit parse, price history, and provenance. This is where you verify the work.
 */
export function SkuDetailDrawer({ sku, onClose }: { sku: CatalogSkuRow; onClose: () => void }) {
  const [detail, setDetail] = useState<CatalogDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    chefAdmin<CatalogDetail>("catalog.get", { skuId: sku.id })
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : "Failed to load"));
    return () => {
      cancelled = true;
    };
  }, [sku.id]);

  const d = detail?.sku ?? sku;
  const maxPrice = Math.max(1, ...(detail?.priceHistory ?? []).map((p) => p.price));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-neutral-200 bg-white px-6 py-4">
          <div className="flex items-start gap-3">
            {d.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-contain ring-1 ring-neutral-200" />
            ) : null}
            <div>
              <h2 className="text-base font-semibold text-neutral-900">{d.rawName}</h2>
              <p className="font-mono text-xs text-neutral-500">{d.skuHandle ?? d.skuRef}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="m-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
        ) : null}

        <div className="space-y-6 px-6 py-5">
          <Section title="Matcher output">
            <Field label="semanticBase" value={d.semanticBase} mono />
            <Field label="variant" value={d.variant ?? "(none)"} mono />
            <Field label="semanticName" value={d.semanticName} mono />
            <Field label="category" value={d.category} />
            <Field label="isIngredient" value={d.isIngredient == null ? "—" : String(d.isIngredient)} />
            <Field label="matchBand" value={d.matchBand} />
            <Field label="matchConfidence" value={d.matchConfidence != null ? d.matchConfidence.toFixed(2) : "—"} />
            <Field label="matchReason" value={(d as Record<string, unknown>).matchReason as string ?? null} />
          </Section>

          <Section title="Auditor & adjudication">
            <Field label="variant (raw-derived)" value={(d as Record<string, unknown>).variantAuditRaw as string ?? "(none)"} mono />
            <Field label="auditState" value={d.auditState} />
            <Field label="resolutionState" value={d.resolutionState} />
            {detail?.audit?.length ? (
              <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-400">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">Field</th>
                      <th className="px-2 py-1.5 font-medium">Matcher</th>
                      <th className="px-2 py-1.5 font-medium">Auditor</th>
                      <th className="px-2 py-1.5 font-medium">Adjudicator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.audit.map((a, i) => (
                      <tr key={i} className="border-t border-neutral-100">
                        <td className="px-2 py-1.5 font-mono text-neutral-700">{a.field}</td>
                        <td className="px-2 py-1.5 text-neutral-600">{a.matcherValue ?? "—"}</td>
                        <td className="px-2 py-1.5 text-neutral-600">{a.auditorValue ?? "—"}</td>
                        <td className="px-2 py-1.5 font-medium text-neutral-900">{a.adjudicatorValue ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-neutral-400">No field disagreements — matcher and auditor agreed.</p>
            )}
          </Section>

          <Section title="Aisle pass">
            <Field label="aisle" value={d.aisle} />
            <Field label="consensus" value={d.aisleConsensus} />
            <Field label="confidence" value={d.aisleConfidence != null ? d.aisleConfidence.toFixed(2) : "—"} />
            {detail?.aisleAudit?.matcherNotes ? (
              <p className="mt-1 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                <span className="font-medium text-neutral-500">Aisle notes: </span>
                {detail.aisleAudit.matcherNotes}
              </p>
            ) : null}
          </Section>

          <Section title="Tier & units">
            <Field label="budgetTier" value={d.budgetTier ?? "(none — single SKU)"} />
            <Field label="tierContested" value={String(d.tierContested)} />
            <Field label="tierQualityCue" value={d.tierQualityCue} />
            <Field label="clusterSize" value={d.clusterSize != null ? String(d.clusterSize) : "—"} />
            <Field label="pricePerUnitBase" value={d.pricePerUnitBase != null ? d.pricePerUnitBase.toFixed(3) : "—"} />
            <Field label="unitParseStatus" value={d.unitParseStatus} />
          </Section>

          <Section title="Price history">
            {detail?.priceHistory?.length ? (
              <div className="space-y-1.5">
                {detail.priceHistory.slice(0, 16).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 text-neutral-500">{fmtDate(p.observedAt)}</span>
                    <div className="h-2 flex-1 rounded-full bg-neutral-100">
                      <div className="h-2 rounded-full bg-neutral-800" style={{ width: `${(p.price / maxPrice) * 100}%` }} />
                    </div>
                    <span className="w-14 shrink-0 text-right font-mono text-neutral-700">{fmtPence(p.price, p.currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400">No observations yet.</p>
            )}
          </Section>

          <Section title="Provenance">
            <Field label="skuRef" value={d.skuRef} mono />
            <Field label="entityName (Pepesto)" value={d.entityName} />
            <Field label="pack" value={d.quantityStr} />
            <Field label="last seen" value={fmtDate(d.lastSeenAt)} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-40 shrink-0 text-xs text-neutral-400">{label}</span>
      <span className={cn("break-words text-neutral-800", mono && "font-mono text-xs")}>{value || "—"}</span>
    </div>
  );
}

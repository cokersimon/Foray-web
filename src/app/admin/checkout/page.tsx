"use client";

import { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";
import { GiftCodesSection } from "./gift-codes-section";

type CheckoutRow = {
  sessionId: string;
  handoffId: string;
  ownerId: string;
  status: string;
  storeName: string | null;
  createdAt: number;
  handedOffAt: number | null;
  resolvedAt: number | null;
  ageHours: number;
  orderStatus: string | null;
  feeGbp: string;
  stripeStatus: string | null;
  refundCandidate: boolean;
  lastDiagnostic: { step: string; outcome: string; detail: string | null } | null;
};

type CheckoutResponse = { sessions: CheckoutRow[]; staleHours: number };

function statusTone(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "handedOff":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "abandoned":
    case "failed":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export default function CheckoutPage() {
  const [candidatesOnly, setCandidatesOnly] = useState(false);
  const { data, error, isLoading, refetch } = useChefQuery<CheckoutResponse>(
    "checkout.list",
    {},
    { pollMs: 45000 },
  );

  const sessions = data?.sessions ?? [];
  const candidates = sessions.filter((s) => s.refundCandidate);
  const rows = candidatesOnly ? candidates : sessions;

  return (
    <div className="p-8 lg:p-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Checkout
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Gift codes for free convenience-fee checkouts, plus the refund-candidate
          reconciliation view for paid sessions.
        </p>
      </div>

      <GiftCodesSection />

      <section className="mt-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Status
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-neutral-500">
              A refund-candidate detector, not a success/fail ledger. There is no
              retailer callback in v1, so &ldquo;confirmed&rdquo; is the
              user&rsquo;s self-attestation, &ldquo;abandoned&rdquo; is a 30-min
              timeout, and the £2.49 fee is charged at handoff regardless of
              outcome. A row is flagged when it was charged but not confirmed after{" "}
              {data?.staleHours ?? "N"} hours. Refunds are issued manually in
              Stripe.
            </p>
          </div>
          <button
            type="button"
            onClick={refetch}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>

        {candidates.length > 0 ? (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              <strong>{candidates.length}</strong> refund candidate
              {candidates.length === 1 ? "" : "s"} — charged but unconfirmed.
            </span>
            <button
              type="button"
              onClick={() => setCandidatesOnly((v) => !v)}
              className="ml-auto rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium hover:bg-red-100"
            >
              {candidatesOnly ? "Show all" : "Show only candidates"}
            </button>
          </div>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Couldn&rsquo;t load checkout data: {error}. This view needs the{" "}
            <code className="rounded bg-amber-100 px-1">checkout.*</code> chef-admin
            action deployed.
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3 font-medium">Handoff</th>
                <th className="px-4 py-3 font-medium">Store</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Fee</th>
                <th className="px-4 py-3 font-medium">Stripe</th>
                <th className="px-4 py-3 font-medium">Order</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-400">
                    No checkout sessions.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.sessionId}
                    className={cn(
                      "border-b border-neutral-100 last:border-0 align-top",
                      row.refundCandidate && "bg-red-50/40",
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                      {row.handoffId.slice(0, 12)}…
                      {row.refundCandidate ? (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                          REFUND?
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {row.storeName ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          statusTone(row.status),
                        )}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {fmtAge(row.ageHours)}
                    </td>
                    <td className="px-4 py-3 text-neutral-700">£{row.feeGbp}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.stripeStatus ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {row.orderStatus ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

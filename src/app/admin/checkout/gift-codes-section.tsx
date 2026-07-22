"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Plus, RefreshCw, Search, X } from "lucide-react";
import { chefAdmin } from "@/lib/chef-api";
import { useChefQuery } from "@/lib/use-chef-query";
import { cn } from "@/lib/cn";

type GiftCodeStatus = "issued" | "redeemed" | "revoked";

type GiftCodeRow = {
  id: string;
  code: string;
  ownerId: string;
  status: GiftCodeStatus;
  issuedAt: number;
  redeemedAt: number | null;
  note: string | null;
  accountRef: string;
};

type GiftCodesResponse = {
  giftCodes: GiftCodeRow[];
  counts: { issued: number; redeemed: number; revoked: number };
};

type IssueResponse = {
  giftCode: GiftCodeRow;
  emailSent: boolean;
};

type Filter = "all" | GiftCodeStatus;

const FILTERS: ReadonlyArray<[Filter, string]> = [
  ["all", "All"],
  ["issued", "Issued"],
  ["redeemed", "Redeemed"],
  ["revoked", "Revoked"],
];

function statusTone(status: GiftCodeStatus): string {
  switch (status) {
    case "issued":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "redeemed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "revoked":
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
  }
}

function fmtWhen(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(Number(ms))) return "—";
  return new Date(Number(ms)).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Owner UUID, FA-ref, or bare 8-hex → the arg shape giftCodes.issue expects. */
function parseOwnerInput(raw: string): { ownerId?: string; accountRef?: string } {
  const v = raw.trim();
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
  ) {
    return { ownerId: v.toLowerCase() };
  }
  const hex = v.replace(/^FA-/i, "");
  if (/^[0-9a-f]{8}$/i.test(hex)) {
    return { accountRef: `FA-${hex.toUpperCase()}` };
  }
  return { accountRef: v };
}

export function GiftCodesSection() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [showIssue, setShowIssue] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const args = useMemo(
    () => ({ filter, search, limit: 200 }),
    [filter, search],
  );
  const { data, error, isLoading, refetch } = useChefQuery<GiftCodesResponse>(
    "giftCodes.list",
    args,
    { pollMs: 45000 },
  );

  const counts = data?.counts ?? { issued: 0, redeemed: 0, revoked: 0 };
  const total = counts.issued + counts.redeemed + counts.revoked;
  const rows = data?.giftCodes ?? [];

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  };

  const revoke = async (codeId: string) => {
    setBusyId(codeId);
    setActionError(null);
    try {
      await chefAdmin("giftCodes.revoke", { codeId });
      flash("Code revoked");
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-neutral-500">
          Single-use, account-locked codes that cover the £2.49 convenience fee.
          Issue to an owner UUID or FA- account ref; the branded email goes out
          best-effort. Redeemed codes stay history — revoke only works while still
          issued.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={refetch}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowIssue(true)}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" /> Issue
          </button>
        </div>
      </div>

      {toast ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {toast}
        </div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {actionError}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Couldn&rsquo;t load gift codes: {error}. Needs the{" "}
          <code className="rounded bg-amber-100 px-1">giftCodes.*</code> chef-admin
          actions deployed.
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {FILTERS.map(([key, label]) => {
          const badge =
            key === "all"
              ? total
              : counts[key as keyof typeof counts];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                filter === key
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:bg-neutral-50",
              )}
            >
              {label}
              <span
                className={cn(
                  "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px]",
                  filter === key ? "bg-white/20" : "bg-neutral-100 text-neutral-500",
                )}
              >
                {badge}
              </span>
            </button>
          );
        })}
        <form
          className="ml-auto flex min-w-[220px] flex-1 items-center gap-2 sm:max-w-xs"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchDraft.trim());
          }}
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Code or FA- ref"
              className="w-full rounded-lg border border-neutral-200 py-1.5 pl-8 pr-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Search
          </button>
        </form>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Account</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Issued</th>
              <th className="px-4 py-3 font-medium">Redeemed</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium" />
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
                  No gift codes{filter !== "all" ? ` in ${filter}` : ""}.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-0 align-top"
                >
                  <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-800">
                    <Copyable value={row.code} />
                  </td>
                  <td className="px-4 py-3">
                    <Copyable value={row.accountRef} className="font-mono text-xs" />
                    <div className="mt-0.5 font-mono text-[10px] text-neutral-400">
                      {row.ownerId.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                        statusTone(row.status),
                      )}
                    >
                      {row.status === "redeemed" ? (
                        <Check className="h-3 w-3" />
                      ) : null}
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {fmtWhen(row.issuedAt)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {row.status === "redeemed" ? fmtWhen(row.redeemedAt) : "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-neutral-500">
                    {row.note ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.status === "issued" ? (
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void revoke(row.id)}
                        className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                      >
                        {busyId === row.id ? "…" : "Revoke"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showIssue ? (
        <IssueModal
          onClose={() => setShowIssue(false)}
          onIssued={(result) => {
            // Keep the modal open so the code is visible to copy; refresh the list behind it.
            flash(
              result.emailSent
                ? `Issued ${result.giftCode.code} — email sent`
                : `Issued ${result.giftCode.code} — email not sent (no address or Resend failed)`,
            );
            refetch();
          }}
        />
      ) : null}
    </section>
  );
}

function Copyable({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        } catch {
          /* ignore */
        }
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded hover:bg-neutral-100",
        className,
      )}
    >
      {value}
      {copied ? (
        <Check className="h-3 w-3 text-emerald-600" />
      ) : (
        <Copy className="h-3 w-3 text-neutral-400" />
      )}
    </button>
  );
}

function IssueModal({
  onClose,
  onIssued,
}: {
  onClose: () => void;
  onIssued: (result: IssueResponse) => void;
}) {
  const [owner, setOwner] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<IssueResponse | null>(null);

  const submit = async () => {
    if (!owner.trim()) {
      setError("Owner UUID or FA- account ref required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await chefAdmin<IssueResponse>("giftCodes.issue", {
        ...parseOwnerInput(owner),
        note: note.trim() || null,
      });
      setIssued(result);
      onIssued(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Issue failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-labelledby="issue-gift-title"
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="issue-gift-title"
              className="text-base font-semibold text-neutral-900"
            >
              Issue gift code
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Locked to one account. Paste their FA- ref from Settings → Account,
              or the owner UUID.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {issued ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wider text-emerald-700">
                Code
              </div>
              <div className="mt-1 font-mono text-lg font-semibold text-emerald-900">
                <Copyable value={issued.giftCode.code} />
              </div>
              <div className="mt-2 text-xs text-emerald-800">
                {issued.giftCode.accountRef}
                {issued.emailSent ? " · email sent" : " · email not sent"}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-neutral-600">
                Owner UUID or FA- ref
              </span>
              <input
                autoFocus
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="FA-1A2B3C4D or uuid"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 font-mono text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-neutral-600">
                Note <span className="font-normal text-neutral-400">(optional)</span>
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. TestFlight tester · batch 3"
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </label>
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submit()}
                className="rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {busy ? "Issuing…" : "Issue code"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

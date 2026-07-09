export function DraftBanner() {
  return (
    <div className="mb-10 rounded-2xl border border-brand-dot/30 bg-brand-dot/10 px-5 py-4 text-sm leading-relaxed text-foreground">
      <strong className="font-semibold">Draft, pending legal review.</strong>{" "}
      This document is an engineering and product draft, not legal advice. It
      will be reviewed and finalised by a qualified lawyer before launch. Items
      in brackets are placeholders awaiting a business or legal decision.
    </div>
  );
}

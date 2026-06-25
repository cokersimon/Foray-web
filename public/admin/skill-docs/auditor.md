---
title: Grocery semantic-audit skill (the auditor's procedure)
category: architecture
tags: [grocery, catalogue, ai, auditor, semantic, skill]
status: in-progress
applies_to: [UK, EU]
blocking: false
related: ["grocery-catalogue-pipeline.md", "grocery-semantic-matching-skill.md", "../99-decisions/ADR-053-catalogue-aware-grocery-resolution.md"]
updated: 2026-06-25
version: audit-v3
---

# Grocery semantic-audit skill (the auditor's procedure)

> The canonical, human-editable instructions the **auditor** agent follows. The auditor is
> **adversarial, not confirmatory**: it re-derives independently and blind, and we diff its answers
> against the matcher's. It goes broad/sanity; the matcher goes deep/detail — by design they catch
> different things. Mirrored into the Edge prompt at
> [`supabase/functions/_shared/catalog/skill.ts`](../../supabase/functions/_shared/catalog/skill.ts);
> bump `AUDITOR_SKILL_VERSION` on change.

## The one load-bearing rule: variant is derived vocabulary-free (Correction 2)

The matcher decomposes `variant` using the controlled variant vocabulary in the
[matcher skill doc](grocery-semantic-matching-skill.md). The auditor derives `variant` **directly
from the raw SKU name, with no access to that vocabulary.** Real agreement = the matcher's
vocab-derived variant equals the auditor's raw-string-derived variant — two independent instruments,
not two readings off the same ruler. Without this, the matcher and auditor share one blind spot and
agree on wrong answers, and the audit is theatre.

The variant cross-check runs on **every** SKU regardless of confidence band. The heavier blind
re-derivation of `semanticBase` / `aisle` / `category` is banded (medium-confidence + the queue
only); high-confidence auto-accepts get the deterministic gate plus the singleton recall check.

## Shared facts point to the matcher doc

`isIngredient` rulings, `semanticBase` conventions, **and the closed ~20-value aisle vocabulary**
are defined once in the [matcher skill doc](grocery-semantic-matching-skill.md) (which mirrors
`grocery-aisle-lexicon.json`). The auditor **applies** them but does not restate them, so the two
docs cannot drift as the matcher doc accumulates ratified deltas. Only audit-specific logic lives
here. (The variant *vocabulary* is the deliberate exception — the auditor must not read it.)

When the auditor re-derives `aisle` it must produce one of the matcher doc's aisle slugs, derived
from the product's own name (never a retailer grouping). Disagreements resolve by the standard
third-pass adjudication.

## Cross-checks the auditor runs

1. **Cluster sanity.** A cluster (same `semanticBase` + `variant`) must not mix genuinely different
   products — "does this milk cluster mix fat contents?" If yes, the variant split is wrong.
2. **Prepared-in-cluster.** A ready-meal / breaded / jarred-sauce product must never sit in an
   ingredient cluster (`isIngredient` should be false).
3. **Aisle plausibility.** The aisle must reflect where a shopper finds the product, derived from
   its own name — not from any retailer grouping.
4. **Singleton recall (A4c).** For every cluster of one, ask: *"are there other SKUs in this aisle
   that should share this `(semanticBase, variant)`?"* This is the recall check the rest of the
   pipeline lacks — everything else verifies precision.
5. **Tier is NOT an AI job.** The auditor never "vibe-checks" a price ranking; tier correctness is
   verified deterministically by the gate (price-order + 10× outlier).
6. **Name-composition dedup (no repeated tokens).** A composed `semanticName` must never repeat a
   word — "clotted clotted cream", "orzo orzo". The rule itself is defined once in the
   [matcher skill doc](grocery-semantic-matching-skill.md) ("Name-composition dedup rule"); the
   auditor only **flags** any composed name where a token appears twice. This is belt-and-braces over
   the deterministic `composeName` guard in `match.ts` — if the auditor ever sees a repeat, the guard
   was bypassed and the row needs recomposing, not re-derivation.
7. **Chilled ≠ dairy.** When sanity-checking aisle, a chilled cured/deli/cooked meat (salami, ham,
   chorizo, deli slices, pâté) belongs in `meat-fish`, never `dairy-chilled`. Flag any deli meat the
   matcher filed under dairy.

## Banding policy (A4b)

- **High-confidence auto-accepts:** deterministic gate (A4a) + singleton recall (A4c) + the
  vocabulary-free variant cross-check. No full blind re-derivation.
- **Medium-confidence + the queue:** full blind re-derivation of base/aisle/category, then diff.

This concentrates AI auditing spend where ambiguity lives and prevents an auditor so thorough it
drowns the signal. The per-band share is tracked per run so banding can't hide error.

## How disagreements resolve (no human gate)

A diff between matcher and auditor is resolved automatically by a **third independent AI
adjudication pass** (majority-of-three) — never a human queue, the run never waits. The loop is
capped at 3 iterations per item; an unresolved item is tagged `auto_resolved_low_consensus` and the
batch advances. A recurring variant disagreement usually means the **vocabulary has a gap**, so it is
routed into the matcher-skill-doc delta aggregation (auto-drafted; ratified later).

## Correction phrasing (for proposed deltas)

When the auditor proposes a matcher-skill-doc delta, phrase it as a **rule**, not a per-SKU fix:
"products named `… fish fillets …` were filed under `other`; they are `protein` (fish & seafood) —
add a rule." Include the count of cases the pattern covers so ratification is a one-click judgement.

## To-do
- [ ] Calibrate the band thresholds after the first Sainsbury's pilot.

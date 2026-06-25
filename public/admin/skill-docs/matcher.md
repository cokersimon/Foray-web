---
title: Grocery semantic-matching skill (the matcher's procedure)
category: architecture
tags: [grocery, catalogue, ai, matcher, semantic, skill]
status: in-progress
applies_to: [UK, EU]
blocking: false
related: ["grocery-catalogue-pipeline.md", "grocery-semantic-audit-skill.md", "../99-decisions/ADR-053-catalogue-aware-grocery-resolution.md", "data-schema.md"]
updated: 2026-06-25
---

# Grocery semantic-matching skill (the matcher's procedure)

> The canonical, human-editable instructions the **matcher** agent follows when tagging supermarket
> SKUs into Foray's taxonomy. This is the **single source of truth for shared facts** (variant
> vocabularies, `isIngredient` rulings, base conventions). The auditor doc points here rather than
> restating them — except the variant *vocabulary*, which the auditor deliberately must not see
> (Correction 2). Load-bearing facts are mirrored into the Edge prompt at
> [`supabase/functions/_shared/catalog/skill.ts`](../../supabase/functions/_shared/catalog/skill.ts);
> edit this doc first, then mirror, then bump `MATCHER_SKILL_VERSION`.

## What the matcher produces per SKU

Each SKU is decomposed into discrete, controlled fields — never a free-text suffix:

| Field | Meaning |
|-------|---------|
| `semanticBase` | The abstract ingredient identity. Lowercase, singular, no brand/marketing/provenance ("Tesco Finest Spaghetti" → `spaghetti`). |
| `variant` | A controlled, **cooking-relevant** discriminator the cook deliberately chooses between, or `null`. |
| `semanticName` | The composed display form = `variant + base` ("semi-skimmed milk"), or just the base when variant is null. Derived, never authored. |
| `category` | The swap group (coarser than `semanticName`, finer than `aisle`). |
| `isIngredient` | `true` for a raw/base cooking ingredient; `false` for a composite/ready product. |
| `tierQualityCue` | A qualitative read (`value`/`mid`/`premium`) of own-label/value vs finest/premium positioning. **Not** the tier — tier is price-derived. |
| `matchConfidence` | 0–1 self-rated confidence. |
| `matchReason` | One short clause explaining the decision. |

`budgetTier` is **never** assigned by the matcher — it is computed deterministically from
price-per-unit after matching (see `tier.ts` / the pipeline doc).

## The variant axis (A1c) — the most important rule

`semanticName` is **not a single-axis label**. Semi-skimmed, whole, skimmed, and 1% milk are
different products a user deliberately chooses, **not** a budget ladder. If they all collapse to
`milk`, price tiering hands a whole-milk user skimmed milk because it is a penny cheaper — a
wrong-product error. So clustering and tiering happen within `(semanticBase, variant)`, never
`semanticBase` alone.

Controlled variant vocabulary (grown via ratified deltas; mirror in `skill.ts`):

| base | variants |
|------|----------|
| milk | whole · semi-skimmed · skimmed · 1% |
| rice | long-grain · basmati · brown · wholegrain · arborio · jasmine |
| flour | plain · self-raising · strong · wholemeal |
| butter | salted · unsalted |
| eggs | medium · large · small |
| sugar | granulated · caster · icing · demerara · brown |
| peanut butter | smooth · crunchy |
| wine vinegar | white · red |
| olive oil | extra virgin · light |
| bacon | smoked · unsmoked · streaky · back |

**Default variant for a variant-less request** (resolver semantics; mirror in `tier.ts`
`DEFAULT_VARIANTS`): `milk → semi-skimmed`, `rice → long-grain`, `flour → plain`, `butter →
salted`, `eggs → medium`, `sugar → granulated`, `olive oil → extra virgin`. A line that says only
"milk" resolves to the default variant, **never "cheapest across all variants."**

## Name-composition dedup rule (standing instruction)

When composing `semanticName` from `variant + base`, **verify the variant token is not already
contained in the base, and never emit a repeated token.** Examples: variant `clotted` + base
`clotted cream` → `clotted cream` (not "clotted clotted cream"); base `orzo` variant `orzo` → `orzo`.
This is a string-composition guard — the base and variant values themselves are still correct; only
the composed display string is deduplicated. Implemented in `composeName` (`match.ts`) at write time,
so it applies on every match and re-match (no separate backfill: the `catalogSku.semanticName →
catalogSemantic` FK and the concept spine make an in-place SQL rewrite unsafe, and a re-match
recomposes + re-upserts the clean concept anyway). The auditor also flags any repeated token it sees
(cross-check 6 in the audit skill doc) as belt-and-braces.

## The ambiguous-modifier default (A1d)

When unsure whether a modifier is a real variant or just a tier/marketing signal, **treat it as a
tier signal — keep the products in one cluster, do not split.** Splitting on a marketing word
("Italian", "British", "finest", "organic") fragments a real cluster into false singletons. Merging
a genuine variant is the less-damaging error and is caught at spot-test. The **direction** is fixed
so the matcher and auditor fail the same way and don't flood the queue with convention gaps.

Modifiers that **must** split (genuinely different cooking products, not tiers): the variant
vocabulary above (whole/semi-skimmed/skimmed, plain/self-raising, salted/unsalted, smooth/crunchy,
white/red wine vinegar, extra-virgin/light oil, …).

## `isIngredient` vs `isPreparedProduct` (A1e)

Recipe-ingredient resolution only ever matches `isIngredient = true`; prepared products stay
catalogued and searchable but are excluded from ingredient clusters and the resolver. Worked
rulings (so the matcher does not coin-flip per batch):

- tinned / chopped **tomatoes** = ingredient
- jarred **pasta sauce** = prepared
- **stock cubes / stock pots** = ingredient
- pre-cooked / microwave **rice pouches** = prepared
- **tinned pulses** (beans, chickpeas, lentils) = ingredient
- breaded / battered / marinated / kievs / ready-meals / pies / soups = prepared

Test: "would a recipe list this by name as an ingredient?" If yes → `true`.

## Aisle placement — the sole store-navigation taxonomy (v2)

`aisle` is the **single source of truth** for store navigation across the whole app (grocery list,
in-store store-search sheet, and all three retailers). It is a closed, flat ~20-value vocabulary —
no parent/child nesting — defined once in
[`grocery-aisle-lexicon.json`](../../supabase/functions/_shared/grocery-aisle-lexicon.json) and
mirrored into `skill.ts`. Canonical value is the **slug**; the human label is display-only
(localized on iOS). The aisle is frozen upstream by the A0 consensus pass; the matcher works within
one frozen aisle at a time, scoped to that aisle's candidate SKUs.

| slug | label |
|------|-------|
| `fruit-veg` | Fruit & Vegetables |
| `meat-fish` | Meat & Fish |
| `dairy-chilled` | Dairy, Eggs & Chilled |
| `bakery` | Bakery |
| `frozen` | Frozen |
| `tins-cans` | Tins & Cans |
| `pasta-rice-noodles` | Pasta, Rice & Noodles |
| `cooking-oils` | Cooking Ingredients & Oils |
| `herbs-spices` | Herbs, Spices & Seasoning |
| `condiments-sauces` | Condiments & Sauces |
| `baking` | Baking |
| `breakfast-cereals` | Breakfast Cereals |
| `snacks-confectionery` | Snacks, Crisps & Confectionery |
| `nuts-seeds-dried-fruit` | Nuts, Seeds & Dried Fruit |
| `drinks` | Drinks |
| `world-foods` | World Foods |
| `household` | Household (non-food: cleaning, toiletries, paper, pet) |
| `other` | Other (final fallback only — target <3% of SKUs; more than that means the vocab has a gap) |

The granular store-cupboard aisles (`tins-cans`, `pasta-rice-noodles`, `cooking-oils`,
`herbs-spices`, `condiments-sauces`) are deliberate: they replace one oversized "Food Cupboard" so
the matcher's per-aisle candidate sets stay small — that tight search space is what the accuracy
model depends on.

**Worked examples** (the cases the old coarse vocab misfiled):

- ambient baking goods (cocoa, yeast, vanilla, chocolate chips, flour, sugar, icing) → `baking`, not `other`
- salt, pepper, dried herbs, bay leaves, ground spices, curry powder → `herbs-spices`
- pesto, Worcester sauce, ketchup, mustard, soy sauce → `condiments-sauces`
- spreads (peanut butter, jam, marmalade, honey, chocolate/nut spread) → `condiments-sauces`, not `baking`
- olives, cooking oils, vinegars, stock, tomato purée, passata → `cooking-oils`
- dry coatings & crumbs (breadcrumbs, panko, golden/southern-fried coating, Paxo stuffing mix) → `cooking-oils`, not `baking`
- chia, sunflower seeds, whole almonds, cashews, dried fruit → `nuts-seeds-dried-fruit`, not `snacks-confectionery`
- raw popping corn kernels → `nuts-seeds-dried-fruit` (a raw dried good, not `baking`); oats, porridge, granola, muesli → `breakfast-cereals` (not snacks)
- baguette, fresh bread, wraps, bagels, croissants → `bakery`, not `pasta-rice-noodles`
- dry pasta, rice, orzo, noodles, couscous → `pasta-rice-noodles`
- tinned tomatoes, beans, tuna, sweetcorn, tinned soup → `tins-cans`
- juice, water, squash, tea, coffee → `drinks`
- coconut milk, cornmeal, miso, and store-range Asian/Caribbean lines → `world-foods`

### Pilot corrections (Sainsbury's 80-SKU pilot, 2026-06-25)

These are the patterns the first pilot got wrong or left ambiguous. They are **rules, not per-SKU
fixes** — each repeats across the full catalogue, so pinning them here is what keeps the 1,540-SKU
run consistent.

- **Chilled cured / deli / cooked meats → `meat-fish`, NEVER `dairy-chilled`.** Salami, ham,
  chorizo, pepperoni/Peperami, prosciutto, salami sticks, deli slices, pâté, cooked/sliced meats.
  They are chilled, but **"chilled" alone never means dairy.** `dairy-chilled` is **only** milk,
  cheese, butter, yoghurt, cream, and eggs. A UK shopper looks for ham in the meat/deli aisle, not
  beside the milk. (Every deli meat in the catalogue tripped this; it is the one true pattern error.)
- **Raw popping corn kernels → `nuts-seeds-dried-fruit`.** Unpopped kernels are a raw dried good,
  not a baking ingredient and not a snack (the bagged crisps/sweets sense).
- **Olives → `cooking-oils`** (decision, not default). There is no antipasti/deli aisle; olives are
  jarred ambient goods used in cooking, so they live in the food-cupboard `cooking-oils` aisle. The
  `category` swap layer keeps them distinct from oils within that aisle. Always `cooking-oils`, never
  `snacks-confectionery`.
- **Spreads (peanut butter, jam, marmalade, honey, chocolate/nut spread) → `condiments-sauces`**
  (decision). There is no dedicated spreads aisle; group them with `condiments-sauces` so `baking`
  stays strictly for baking *inputs* (flour, sugar, cocoa, raising agents).
- **Dry coatings & crumbs (breadcrumbs, panko, golden/southern-fried coating, Paxo) → `cooking-oils`**
  (decision). They are cooking-prep goods, not baking inputs; keep all three breadcrumb lines together.

**Confirmed-correct placements** (called out because they look surprising but are right): cocoa &
chocolate chips → `baking`; turkey bacon, pork, sea bass → `meat-fish`; tinned tuna/beans/sweetcorn/
plum tomatoes/mushy peas → `tins-cans`; cornmeal & red split lentils (Dunn's River, Laila) →
`world-foods`.

### `category` is the swap layer, not navigation

`category` still exists, but **only** to scope swaps *within* an aisle (it powers the swap sheet —
`listCategoryAlternatives` → `CatalogSwapSheet`). An aisle still contains multiple non-swappable
concept groups (`cooking-oils` holds oils, vinegars, stock, olives), so category groups the
swappable ones (swap olive oil → sunflower oil, never → tomato purée). It is **not** retailer
merchandising data (that lives in `rawPayload`/`retailerTags`) and it is **not** a navigation layer.
See [`grocery-category-lexicon.json`](../../supabase/functions/_shared/grocery-category-lexicon.json).

## Multi-aisle ingredients (A5-N)

Some ingredients legitimately appear in several aisles (coconut as milk/cream/oil/desiccated/water;
basil as fresh/dried/paste). The resolver consults a small fallback map before declaring a line
unavailable; the map lives in `skill.ts` (`MULTI_AISLE_INGREDIENTS`). This does not weaken the
matcher's per-aisle partition — it is resolve-time only.

## Per-store addenda (retailer peculiarities)

The general rules above hold for every store; each retailer's own-label and premium ranges are
listed here so they map to `tierQualityCue`, never to `semanticBase`/`variant`:

- **Sainsbury's:** "by Sainsbury's" (standard), "Taste the Difference" (premium), "Stamford Street" /
  "J. James" (value lines). Strip these to brand; never let them split a cluster.
- **Tesco:** "Tesco Finest" (premium), "Stockwell & Co" / "Tesco Everyday Value" (value), "Tesco
  Organic" (variant flag, not a tier on its own).
- **Waitrose:** "Waitrose No.1" (premium), "Essential Waitrose" (standard/value).

## Self-correction (A7)

The auditor proposes deltas to *this* doc (not just per-SKU corrections); ratified deltas are folded
in, the version is bumped, and the golden-set tripwire (A4d) runs to catch regressions. The matcher
re-runs the items the auditor rejected under the updated doc.

## To-do
- [ ] Seed/extend the variant vocabulary from the first Sainsbury's pilot pass.
- [ ] Add Tesco/Waitrose addenda specifics once those dumps are matched.

# App screenshots for marketing phone mockups

Drop real iOS Simulator captures here. [`ProductPhone`](../../src/components/marketing/product-phone.tsx)
renders each PNG with `object-cover` inside the official **iPhone 17 Pro Max Silver**
bezel. If a file is missing, the coded CSS mock for that slot is shown instead.

## Hero carousel (6)

| File | Slide | Capture this |
| --- | --- | --- |
| `hero-plan.png` | 1 | Populated week — mix of meal types — generate control in frame |
| `hero-groceries.png` | 2 | Deduped list + prices + total + checkout sheet with three logos |
| `hero-recipes.png` | 3 | My Recipes library (Saved + Instagram/TikTok sources) |
| `hero-create.png` | 4 | Add a Recipe hub (Chef AI, URL, photo, pantry) |
| `hero-nutrition.png` | 5 | Nutrition Facts + allergen badges on the **same** frame |
| `hero-cook.png` | 6 | Cook Directions with live countdown + floating timer pill |

## How it works (5)

| File | Step | Capture this |
| --- | --- | --- |
| `step-import.png` | 01 Choose a recipe | Planner / My Recipes |
| `step-groceries.png` | 02 Grocery list | Loaded list + store menu open |
| `step-instore.png` | 03 Shop in person | In-store checklist with progress |
| `step-online.png` | 04 Shop online | Choose your store / basket handoff |
| `step-cook.png` | 05 Cooking | Cook Directions + live timer |

## Capture specs

- Simulator: **iPhone 17 Pro Max** (screen contents only — no device chrome)
- Resolution ~1320×2868
- Prefer under ~800 KB (`sips --resampleWidth 1320` — do **not** use `sips -Z` on tall portraits)

## Still needed (hero)

- Proper `hero-plan.png` (populated week; temp stand-in is Planner)
- Proper `hero-groceries.png` (list + checkout peek; temp stand-in is Choose your store)
- `hero-nutrition.png` with nutrition **and** allergen badges on one frame

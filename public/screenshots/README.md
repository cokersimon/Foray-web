# App screenshots for marketing phone mockups

Drop real iOS Simulator captures here. [`ProductPhone`](../../src/components/marketing/product-phone.tsx)
renders each PNG with `object-cover` inside the official **iPhone 17 Pro Max Silver**
bezel. If a file is missing, the coded CSS mock for that slot is shown instead.

## Expected files (8)

| File | Slot | Capture this |
| --- | --- | --- |
| `hero-nutrition.png` | Hero slide 1 | Meal detail + Nutrition Facts |
| `hero-instore.png` | Hero slide 2 | In-store aisle checklist (shopping session) |
| `hero-cook.png` | Hero slide 3 | Cook mode (ingredients / directions) |
| `step-import.png` | Step 01 Choose a recipe | Planner / My Recipes (Instagram share when available) |
| `step-groceries.png` | Step 02 Grocery list | Aisle-sorted groceries |
| `step-instore.png` | Step 03 Shop in person | In-store checklist with progress |
| `step-online.png` | Step 04 Shop online | Choose your store / basket handoff |
| `step-cook.png` | Step 05 Cooking | Cook mode |

## Capture specs

- Simulator: **iPhone 17 Pro Max** (screen contents only — no device chrome)
- Light or dark OK (app chrome); prefer a clean UI without blocking alerts
- Resolution ~1320×2868 (matches the Pro Max screen hole in the web bezel)
- Keep key UI away from extreme top/bottom
- Prefer under ~800 KB (`sips --resampleWidth 1320` if needed — do **not** use `sips -Z` on tall portraits)

## Re-capture

From the Foray iOS repo UI tests:

```bash
cd /Users/simoncoker/Foray/app
xcodegen generate
xcodebuild test -scheme Foray \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro Max' \
  -only-testing:ForayUITests/MarketingScreenshotsUITests
```

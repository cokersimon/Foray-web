# App screenshots for the marketing scrollytelling

Drop real iOS Simulator captures here and the landing page's phone mockup will
render them automatically (see `src/app/(marketing)/page.tsx` — the check is
`existsSync` per file, so partial sets are fine). Until a file exists, the
coded CSS mockup for that beat is shown instead.

## Expected files

| File | Scrollytelling beat | Capture this app screen |
| --- | --- | --- |
| `import.png` | "Import any recipe." | Import flow — link pasted, AI Chef parsing / parsed recipe |
| `plan.png` | "Swipe to fork." | Plan swipe deck with a recipe card front and centre |
| `cart.png` | "One sorted trolley." | Groceries list, deduped and grouped by aisle |
| `checkout.png` | "Five clicks to dinner." | Checkout summary / building-basket sheet |

## Dimensions

- Capture on an iPhone with a 9:19.5-ish display (e.g. iPhone 16 Pro,
  1206 x 2622). The slot crops to `object-cover` inside a 9:16 frame, so keep
  key content centred and away from the extreme top/bottom.
- PNG, light mode, no simulator bezel (plain `Cmd+S` capture is fine — the web
  frame supplies its own bezel and notch).
- Keep files under ~500 KB each if possible (`sips -Z 1200 file.png` helps);
  they're served through `next/image` either way.
